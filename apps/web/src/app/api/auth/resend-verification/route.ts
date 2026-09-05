import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { issueAuthToken } from "@/lib/auth-tokens";
import { sendEmailVerification } from "@/lib/mail";
import { distributedRateLimit } from "@/lib/distributed-rate-limit";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true });

  const limit = await distributedRateLimit(`verify-email:${user.id}`, 3, 60 * 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Esperá antes de reenviar" }, { status: 429 });

  const token = await issueAuthToken(user.id, "EMAIL_VERIFICATION", 24 * 60);
  const url = `${process.env.APP_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${token}`;
  await sendEmailVerification({ to: user.email, name: user.name, url }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
