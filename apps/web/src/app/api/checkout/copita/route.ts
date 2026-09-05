import { db } from "@copita/db";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { sellerAccessToken } from "@/lib/mercadopago";
import { platformFeeAmount, feeRateBps } from "@/lib/platform-fee";
import { copitaAmountArs } from "@/lib/pricing";
import { computeFinePortion, outstandingFineUsd } from "@/lib/content-violations";
import { logger } from "@/lib/logger";

const inputSchema = z.object({
  username: z.string().trim().toLowerCase().min(1),
  quantity: z.coerce.number().int().min(1).max(50).default(1),
  message: z.string().trim().max(280).optional(),
  senderName: z.string().trim().max(80).optional(),
  senderEmail: z.string().trim().toLowerCase().email(),
});

async function handleCheckout(request: NextRequest) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const { username, quantity, message, senderName, senderEmail } = parsed.data;

  const creator = await db.user.findUnique({ where: { username } });
  if (!creator || !creator.mpConnected || !creator.mpAccessToken) return NextResponse.json({ error: "Este creador todavía no conectó Mercado Pago" }, { status: 503 });

  const { amount, fxRateUsed } = await copitaAmountArs(Number(creator.copitaPriceUsd), quantity);
  const fee = platformFeeAmount(amount, creator);
  const idempotencyKey = randomUUID();

  const activeViolation = await db.contentViolation.findFirst({ where: { creatorId: creator.id, resolvedAt: null } });
  const { finePortionArs, finePortionUsd } = activeViolation
    ? computeFinePortion({ outstandingUsd: outstandingFineUsd({ ...activeViolation, collectedUsd: Number(activeViolation.collectedUsd) }), amountArs: amount, normalFeeArs: fee, fxRateUsed })
    : { finePortionArs: 0, finePortionUsd: 0 };
  const totalFee = fee + finePortionArs;

  const copita = await db.$transaction(async (tx) => {
    const created = await tx.copita.create({
      data: {
        creatorId: creator.id,
        amount,
        amountUsdRef: Number(creator.copitaPriceUsd) * quantity,
        fxRateUsed,
        quantity,
        message,
        senderName,
        senderEmail,
        idempotencyKey,
        contentViolationId: activeViolation?.id,
        finePortionArs: finePortionArs > 0 ? finePortionArs : null,
        finePortionUsd: finePortionUsd > 0 ? finePortionUsd : null,
      },
    });
    await tx.commission.create({ data: { copitaId: created.id, rateBps: feeRateBps(creator), baseAmount: amount, amount: totalFee } });
    return created;
  });

  const appUrl = (process.env.APP_URL ?? request.nextUrl.origin).replace(/\/$/, "");
  const backBase = `${appUrl}/${creator.username}/gracias`;

  let accessToken: string;
  try {
    accessToken = await sellerAccessToken(creator);
  } catch (error) {
    // sellerAccessToken ya loguea el detalle (mercadopago.token_refresh_failed) —
    // acá solo dejamos registro en la propia copita para no perder el rastro
    // de qué pago quedó a mitad de camino.
    const message = error instanceof Error ? error.message : "No se pudo autenticar con Mercado Pago";
    await db.copita.update({ where: { id: copita.id }, data: { rawResponse: { error: message } } });
    return NextResponse.json({ error: message }, { status: 422 });
  }

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json", authorization: `Bearer ${accessToken}`, "x-idempotency-key": idempotencyKey },
    body: JSON.stringify({
      items: [{ id: copita.id, title: `Copita para @${creator.username}`, quantity: 1, unit_price: amount, currency_id: "ARS" }],
      payer: { email: senderEmail },
      marketplace_fee: totalFee,
      external_reference: copita.id,
      notification_url: `${appUrl}/api/webhooks/mercadopago?creator=${creator.username}`,
      back_urls: { success: `${backBase}?estado=exitoso`, failure: `${backBase}?estado=fallido`, pending: `${backBase}?estado=pendiente` },
      auto_return: "approved",
    }),
  });
  const preference = (await response.json()) as { id?: string; init_point?: string; sandbox_init_point?: string; message?: string };
  if (!response.ok || !preference.init_point) {
    await db.copita.update({ where: { id: copita.id }, data: { rawResponse: preference } });
    logger.warn("checkout.copita.mp_preference_rejected", { copitaId: copita.id, creatorUsername: creator.username, status: response.status, message: preference.message });
    return NextResponse.json({ error: preference.message ?? "No se pudo iniciar Mercado Pago" }, { status: 422 });
  }
  await db.copita.update({ where: { id: copita.id }, data: { providerPaymentId: preference.id, rawResponse: preference } });
  return NextResponse.json({ checkoutUrl: process.env.MP_USE_SANDBOX === "true" ? preference.sandbox_init_point ?? preference.init_point : preference.init_point });
}

export async function POST(request: NextRequest) {
  try {
    return await handleCheckout(request);
  } catch (error) {
    logger.error("checkout.copita.unhandled_exception", { message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 });
  }
}
