import { createHmac, timingSafeEqual } from "node:crypto";
import { db, PaymentStatus, SubscriptionStatus } from "@copita/db";
import { sellerAccessToken } from "@/lib/mercadopago";
import { fetchPreapproval } from "@/lib/mercadopago-subscriptions";
import { feeRateBps, platformFeeAmount } from "@/lib/platform-fee";
import { NextRequest, NextResponse } from "next/server";

type Payload = { id?: number | string; type?: string; action?: string; user_id?: number | string; data?: { id?: string } };

function validSignature(request: NextRequest, dataId: string) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const signature = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(signature.split(",").map((part) => part.split("=").map((v) => v.trim())));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

function mapPaymentStatus(value: string): PaymentStatus {
  return value === "approved" || value === "processed"
    ? "APPROVED"
    : value === "rejected"
      ? "REJECTED"
      : value === "cancelled" || value === "canceled" || value === "expired"
        ? "CANCELLED"
        : value === "refunded"
          ? "REFUNDED"
          : "PENDING";
}

function mapSubscriptionStatus(value: string): SubscriptionStatus {
  return value === "authorized" ? "AUTHORIZED" : value === "paused" ? "PAUSED" : value === "cancelled" ? "CANCELLED" : "PENDING";
}

async function resolveCreator(request: NextRequest, payload: Payload) {
  const usernameParam = request.nextUrl.searchParams.get("creator");
  if (usernameParam) {
    const byUsername = await db.user.findUnique({ where: { username: usernameParam } });
    if (byUsername) return byUsername;
  }
  if (payload.user_id) return db.user.findFirst({ where: { mpUserId: String(payload.user_id) } });
  return null;
}

async function handleCopitaPayment(request: NextRequest, creator: NonNullable<Awaited<ReturnType<typeof resolveCreator>>>, dataId: string, isOrder: boolean, event: { id: string }) {
  const response = await fetch(`https://api.mercadopago.com/v1/${isOrder ? "orders" : "payments"}/${encodeURIComponent(dataId)}`, {
    headers: { authorization: `Bearer ${await sellerAccessToken(creator)}` },
  });
  if (!response.ok) return NextResponse.json({ error: "No se pudo reconciliar" }, { status: 502 });
  const remote = (await response.json()) as { id: number | string; status: string; external_reference?: string };
  const copita = await db.copita.findFirst({
    where: { OR: [{ providerPaymentId: String(remote.id) }, ...(remote.external_reference ? [{ id: remote.external_reference }] : [])], creatorId: creator.id },
  });
  if (!copita) {
    await db.paymentEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }
  const mapped = mapPaymentStatus(remote.status);
  await db.$transaction(async (tx) => {
    await tx.copita.update({ where: { id: copita.id }, data: { status: mapped, providerPaymentId: String(remote.id), rawResponse: remote } });
    const commission = await tx.commission.findUnique({ where: { copitaId: copita.id } });
    if (commission) {
      await tx.commission.update({
        where: { id: commission.id },
        data:
          mapped === "APPROVED"
            ? { status: "COLLECTED", collectedAt: new Date(), reversedAt: null }
            : mapped === "REFUNDED" || mapped === "REJECTED" || mapped === "CANCELLED"
              ? { status: "REVERSED", reversedAt: new Date() }
              : {},
      });
    }
    await tx.paymentEvent.update({ where: { id: event.id }, data: { copitaId: copita.id, processedAt: new Date() } });
  });
  return NextResponse.json({ ok: true });
}

async function handlePreapprovalUpdate(creator: NonNullable<Awaited<ReturnType<typeof resolveCreator>>>, dataId: string, event: { id: string }) {
  const subscription = await db.subscription.findUnique({ where: { mpPreapprovalId: dataId } });
  if (!subscription) {
    await db.paymentEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }
  const remote = await fetchPreapproval(creator, dataId);
  await db.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: mapSubscriptionStatus(remote.status),
        nextBillingDate: remote.next_payment_date ? new Date(remote.next_payment_date) : null,
        cancelledAt: remote.status === "cancelled" ? new Date() : subscription.cancelledAt,
      },
    });
    await tx.paymentEvent.update({ where: { id: event.id }, data: { subscriptionId: subscription.id, processedAt: new Date() } });
  });
  return NextResponse.json({ ok: true });
}

// Cada cobro recurrente de una suscripción autorizada. La comisión de Copita
// NO se descuenta sola acá (Preapproval no soporta split) — queda PENDING.
async function handleAuthorizedPayment(creator: NonNullable<Awaited<ReturnType<typeof resolveCreator>>>, dataId: string, event: { id: string }) {
  const response = await fetch(`https://api.mercadopago.com/authorized_payments/${encodeURIComponent(dataId)}`, {
    headers: { authorization: `Bearer ${await sellerAccessToken(creator)}` },
  });
  if (!response.ok) return NextResponse.json({ error: "No se pudo reconciliar el cobro de la suscripción" }, { status: 502 });
  const remote = (await response.json()) as { id: number | string; status: string; preapproval_id?: string; transaction_amount?: number };
  if (!remote.preapproval_id) return NextResponse.json({ ok: true });
  const subscription = await db.subscription.findUnique({ where: { mpPreapprovalId: remote.preapproval_id } });
  if (!subscription) {
    await db.paymentEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true });
  }
  const mapped = mapPaymentStatus(remote.status);
  const amount = remote.transaction_amount ?? Number(subscription.amount);
  await db.$transaction(async (tx) => {
    const payment = await tx.subscriptionPayment.upsert({
      where: { providerPaymentId: String(remote.id) },
      create: { subscriptionId: subscription.id, providerPaymentId: String(remote.id), idempotencyKey: String(remote.id), status: mapped, amount, rawResponse: remote },
      update: { status: mapped, rawResponse: remote },
    });
    const fee = platformFeeAmount(amount, creator);
    await tx.commission.upsert({
      where: { subscriptionPaymentId: payment.id },
      create: { subscriptionPaymentId: payment.id, rateBps: feeRateBps(creator), baseAmount: amount, amount: fee, status: mapped === "APPROVED" ? "PENDING" : "REVERSED" },
      update: mapped === "REFUNDED" || mapped === "REJECTED" || mapped === "CANCELLED" ? { status: "REVERSED", reversedAt: new Date() } : {},
    });
    await tx.paymentEvent.update({ where: { id: event.id }, data: { subscriptionPaymentId: payment.id, subscriptionId: subscription.id, processedAt: new Date() } });
  });
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as Payload | null;
  const dataId = String(payload?.data?.id ?? request.nextUrl.searchParams.get("data.id") ?? "");
  if (!dataId || !validSignature(request, dataId)) return NextResponse.json({ error: "Firma inválida" }, { status: 401 });

  const type = payload?.type ?? "";
  if (!["payment", "order", "subscription_preapproval", "subscription_authorized_payment"].includes(type)) return NextResponse.json({ ok: true });

  const creator = await resolveCreator(request, payload!);
  if (!creator?.mpAccessToken) return NextResponse.json({ error: "Creador no encontrado" }, { status: 404 });

  const eventId = String(payload!.id ?? dataId);
  const eventType = payload!.action ?? type;
  const duplicate = await db.paymentEvent.findUnique({ where: { provider_providerEventId_eventType: { provider: "mercadopago", providerEventId: eventId, eventType } } });
  if (duplicate?.processedAt) return NextResponse.json({ ok: true });
  const event = duplicate ?? (await db.paymentEvent.create({ data: { providerEventId: eventId, eventType, payload: payload as object } }));

  if (type === "payment" || type === "order") return handleCopitaPayment(request, creator, dataId, type === "order", event);
  if (type === "subscription_preapproval") return handlePreapprovalUpdate(creator, dataId, event);
  return handleAuthorizedPayment(creator, dataId, event);
}
