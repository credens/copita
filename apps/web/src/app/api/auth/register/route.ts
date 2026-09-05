import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionValue, sessionCookie } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { requestIp } from "@/lib/rate-limit";
import { distributedRateLimit } from "@/lib/distributed-rate-limit";
import { issueAuthToken } from "@/lib/auth-tokens";
import { sendEmailVerification } from "@/lib/mail";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/, "Usá solo letras, números y guiones"),
});

const RESERVED_USERNAMES = new Set([
  "admin",
  "panel",
  "login",
  "registro",
  "api",
  "explorar",
  "terminos",
  "privacidad",
  "reembolsos",
  "gracias",
  "club",
  "baja",
  "arrepentimiento",
  "recuperar-contrasena",
  "restablecer-contrasena",
]);

export async function POST(request: Request) {
  const attempt = await distributedRateLimit(`register:${requestIp(request)}`, 5, 60 * 60_000);
  if (!attempt.allowed) return NextResponse.json({ error: "Demasiados registros desde esta conexión" }, { status: 429, headers: { "retry-after": String(attempt.retryAfter) } });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const data = parsed.data;

  if (RESERVED_USERNAMES.has(data.username)) return NextResponse.json({ error: "Ese nombre de usuario no está disponible" }, { status: 409 });
  if (await db.user.findUnique({ where: { email: data.email } })) return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 });
  if (await db.user.findUnique({ where: { username: data.username } })) return NextResponse.json({ error: "Ese nombre de usuario ya está tomado" }, { status: 409 });

  const passwordHash = await hashPassword(data.password);
  const user = await db.user.create({ data: { name: data.name, email: data.email, passwordHash, username: data.username } });

  const token = await issueAuthToken(user.id, "EMAIL_VERIFICATION", 24 * 60);
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${token}`;
  await sendEmailVerification({ to: user.email, name: user.name, url }).catch(() => undefined);

  const response = NextResponse.json({ ok: true, username: user.username });
  response.cookies.set(sessionCookie(createSessionValue(user.id)));
  return response;
}
