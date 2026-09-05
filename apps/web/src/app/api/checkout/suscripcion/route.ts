import { db } from "@copita/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createPreapproval } from "@/lib/mercadopago-subscriptions";
import { subscriptionAmountArs } from "@/lib/pricing";

const inputSchema = z.object({
  username: z.string().trim().toLowerCase().min(1),
  supporterEmail: z.string().trim().toLowerCase().email(),
  supporterName: z.string().trim().max(80).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const { username, supporterEmail, supporterName } = parsed.data;

  const creator = await db.user.findUnique({ where: { username } });
  if (!creator || !creator.mpConnected || !creator.mpAccessToken) return NextResponse.json({ error: "Este creador todavía no conectó Mercado Pago" }, { status: 503 });
  if (!creator.subscriptionEnabled || !creator.subscriptionPriceUsd) return NextResponse.json({ error: "Este creador no tiene Club de Copita activo" }, { status: 422 });

  const { amount, fxRateUsed } = await subscriptionAmountArs(Number(creator.subscriptionPriceUsd));

  const subscription = await db.subscription.create({
    data: { creatorId: creator.id, supporterEmail, supporterName, amount, amountUsdRef: Number(creator.subscriptionPriceUsd) },
  });

  const appUrl = (process.env.APP_URL ?? request.nextUrl.origin).replace(/\/$/, "");
  try {
    const { preapprovalId, checkoutUrl } = await createPreapproval({ creator, subscriptionId: subscription.id, supporterEmail, amountArs: amount, appUrl });
    await db.subscription.update({ where: { id: subscription.id }, data: { mpPreapprovalId: preapprovalId } });
    void fxRateUsed;
    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    await db.subscription.delete({ where: { id: subscription.id } });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo iniciar la suscripción" }, { status: 422 });
  }
}
