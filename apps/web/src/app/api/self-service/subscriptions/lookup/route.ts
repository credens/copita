import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requestIp } from "@/lib/rate-limit";
import { distributedRateLimit } from "@/lib/distributed-rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

// Baja de servicio (Disposición 954/2025): el aportante no tiene cuenta, así
// que la única "verificación razonable" posible hoy es el email con el que
// pagó — sin login, sin barreras extra.
export async function POST(request: Request) {
  const attempt = await distributedRateLimit(`self-service-lookup:${requestIp(request)}`, 20, 15 * 60_000);
  if (!attempt.allowed) return NextResponse.json({ error: "Demasiados intentos. Probá más tarde" }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

  const subscriptions = await db.subscription.findMany({
    where: { supporterEmail: parsed.data.email, status: { in: ["PENDING", "AUTHORIZED", "PAUSED"] } },
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { name: true, username: true } } },
  });

  return NextResponse.json({
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      creatorName: s.creator.name,
      creatorUsername: s.creator.username,
      amount: Number(s.amount),
      status: s.status,
      nextBillingDate: s.nextBillingDate,
      createdAt: s.createdAt,
    })),
  });
}
