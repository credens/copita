import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requestIp } from "@/lib/rate-limit";
import { distributedRateLimit } from "@/lib/distributed-rate-limit";
import { cancelPreapproval } from "@/lib/mercadopago-subscriptions";

const schema = z.object({ subscriptionId: z.string().min(1), email: z.string().trim().toLowerCase().email() });

// Botón de baja de servicio: el aportante cancela su propia suscripción sin
// depender de que el creador lo haga desde su panel (Disposición 954/2025 —
// tiene que poder darse de baja tan fácil como se dio de alta).
export async function POST(request: Request) {
  const attempt = await distributedRateLimit(`self-service-cancel:${requestIp(request)}`, 10, 15 * 60_000);
  if (!attempt.allowed) return NextResponse.json({ error: "Demasiados intentos. Probá más tarde" }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const subscription = await db.subscription.findUnique({ where: { id: parsed.data.subscriptionId }, include: { creator: true } });
  if (!subscription || subscription.supporterEmail !== parsed.data.email) return NextResponse.json({ error: "No encontramos esa suscripción con ese email" }, { status: 404 });

  if (subscription.status === "CANCELLED") return NextResponse.json({ ok: true });

  if (subscription.mpPreapprovalId) {
    try {
      await cancelPreapproval(subscription.creator, subscription.mpPreapprovalId);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo cancelar en Mercado Pago" }, { status: 502 });
    }
  }

  await db.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  return NextResponse.json({ ok: true });
}
