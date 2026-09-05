import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { distributedRateLimit } from "@/lib/distributed-rate-limit";
import { requestIp } from "@/lib/rate-limit";
import { issueAuthToken } from "@/lib/auth-tokens";
import { sendPasswordReset } from "@/lib/mail";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

// Siempre responde { ok: true } sin importar si el email existe, para no
// revelar qué cuentas están registradas.
export async function POST(request: Request) {
  const limit = await distributedRateLimit(`forgot:${requestIp(request)}`, 5, 60 * 60_000);
  if (!limit.allowed) return NextResponse.json({ ok: true });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (parsed.success) {
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (user) {
      const token = await issueAuthToken(user.id, "PASSWORD_RESET", 30);
      const url = `${process.env.APP_URL ?? "http://localhost:3000"}/restablecer-contrasena?token=${token}`;
      await sendPasswordReset({ to: user.email, name: user.name, url }).catch(() => undefined);
    }
  }
  return NextResponse.json({ ok: true });
}
