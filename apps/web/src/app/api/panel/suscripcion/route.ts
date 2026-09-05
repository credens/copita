import { currentUser } from "@/lib/auth";
import { db } from "@copita/db";
import { cancelPreapproval } from "@/lib/mercadopago-subscriptions";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ subscriptionId: z.string().min(1) });

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const subscription = await db.subscription.findUnique({ where: { id: parsed.data.subscriptionId } });
  if (!subscription || subscription.creatorId !== user.id) return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
  if (!subscription.mpPreapprovalId) return NextResponse.json({ error: "Suscripción sin autorización activa" }, { status: 422 });

  try {
    await cancelPreapproval(user, subscription.mpPreapprovalId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo cancelar" }, { status: 502 });
  }
  await db.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  return NextResponse.json({ ok: true });
}
