import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionValue, sessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { requestIp } from "@/lib/rate-limit";
import { distributedRateLimit } from "@/lib/distributed-rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const attempt = await distributedRateLimit(`login:${requestIp(request)}`, 10, 15 * 60_000);
  if (!attempt.allowed) return NextResponse.json({ error: "Demasiados intentos. Probá más tarde" }, { status: 429, headers: { "retry-after": String(attempt.retryAfter) } });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });

  const response = NextResponse.json({ ok: true, username: user.username });
  response.cookies.set(sessionCookie(createSessionValue(user.id)));
  return response;
}
