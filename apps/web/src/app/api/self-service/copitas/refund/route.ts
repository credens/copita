import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requestIp } from "@/lib/rate-limit";
import { distributedRateLimit } from "@/lib/distributed-rate-limit";
import { refundPayment } from "@/lib/mercadopago-refunds";
import { cancelPreapproval } from "@/lib/mercadopago-subscriptions";
import { isWithinWithdrawalWindow } from "@/lib/consumer-rights";

const schema = z.object({ copitaId: z.string().min(1), email: z.string().trim().toLowerCase().email() });

// Botón de arrepentimiento (Ley 24.240 art. 34 + Disposición 954/2025): el
// aportante pide el reembolso de una copita dentro de la ventana legal, sin
// tener que abrir un ticket de soporte ni esperar a que el creador actúe.
//
// El arrepentimiento deshace el vínculo completo con ese creador, no solo el
// pago puntual: si el aportante también es socio del Club de ese creador,
// esa suscripción se cancela en el mismo momento (se le corta el acceso a
// todo lo que compró a ese creador, no solo a la copita reembolsada).
export async function POST(request: Request) {
  const attempt = await distributedRateLimit(`self-service-refund:${requestIp(request)}`, 10, 15 * 60_000);
  if (!attempt.allowed) return NextResponse.json({ error: "Demasiados intentos. Probá más tarde" }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const copita = await db.copita.findUnique({ where: { id: parsed.data.copitaId }, include: { creator: true, commission: true } });
  if (!copita || copita.senderEmail !== parsed.data.email) return NextResponse.json({ error: "No encontramos esa copita con ese email" }, { status: 404 });

  if (copita.status === "REFUNDED") return NextResponse.json({ ok: true, subscriptionsCancelled: 0 });
  if (copita.status !== "APPROVED") return NextResponse.json({ error: "Esta copita todavía no está acreditada, no se puede reembolsar" }, { status: 422 });
  if (!isWithinWithdrawalWindow(copita.createdAt)) return NextResponse.json({ error: "Ya pasó la ventana legal de arrepentimiento para esta copita" }, { status: 422 });
  if (!copita.providerPaymentId) return NextResponse.json({ error: "No se encontró el pago en Mercado Pago" }, { status: 422 });

  try {
    await refundPayment(copita.creator, copita.providerPaymentId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo procesar el reembolso" }, { status: 502 });
  }

  await db.$transaction(async (tx) => {
    await tx.copita.update({ where: { id: copita.id }, data: { status: "REFUNDED" } });
    if (copita.commission) await tx.commission.update({ where: { id: copita.commission.id }, data: { status: "REVERSED", reversedAt: new Date() } });
  });

  // Best-effort: la plata ya se devolvió, así que un fallo acá no debe hacer
  // fallar la respuesta — pero si Mercado Pago rechaza la cancelación queda
  // una suscripción activa sin acceso a copita que la respalde, y hay que
  // avisarle al aportante para que reintente por /baja.
  const activeSubscriptions = await db.subscription.findMany({
    where: { creatorId: copita.creatorId, supporterEmail: copita.senderEmail, status: { in: ["PENDING", "AUTHORIZED", "PAUSED"] } },
  });
  let subscriptionsCancelled = 0;
  let subscriptionCancelFailed = false;
  for (const subscription of activeSubscriptions) {
    try {
      if (subscription.mpPreapprovalId) await cancelPreapproval(copita.creator, subscription.mpPreapprovalId);
      await db.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
      subscriptionsCancelled += 1;
    } catch {
      subscriptionCancelFailed = true;
    }
  }

  return NextResponse.json({ ok: true, subscriptionsCancelled, subscriptionCancelFailed });
}
