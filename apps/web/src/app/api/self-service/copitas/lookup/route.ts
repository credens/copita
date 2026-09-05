import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requestIp } from "@/lib/rate-limit";
import { distributedRateLimit } from "@/lib/distributed-rate-limit";
import { isWithinWithdrawalWindow, withdrawalDeadline } from "@/lib/consumer-rights";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(request: Request) {
  const attempt = await distributedRateLimit(`self-service-lookup:${requestIp(request)}`, 20, 15 * 60_000);
  if (!attempt.allowed) return NextResponse.json({ error: "Demasiados intentos. Probá más tarde" }, { status: 429 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

  const copitas = await db.copita.findMany({
    where: { senderEmail: parsed.data.email, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { creator: { select: { name: true, username: true } } },
  });

  return NextResponse.json({
    copitas: copitas.map((c) => ({
      id: c.id,
      creatorName: c.creator.name,
      creatorUsername: c.creator.username,
      amount: Number(c.amount),
      createdAt: c.createdAt,
      withinWindow: isWithinWithdrawalWindow(c.createdAt),
      deadline: withdrawalDeadline(c.createdAt),
    })),
  });
}
