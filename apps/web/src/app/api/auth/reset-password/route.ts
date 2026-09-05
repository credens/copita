import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeAuthToken } from "@/lib/auth-tokens";
import { hashPassword } from "@/lib/password";

const schema = z.object({ token: z.string().min(32), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const userId = await consumeAuthToken(parsed.data.token, "PASSWORD_RESET");
  if (!userId) return NextResponse.json({ error: "El enlace venció o ya fue utilizado" }, { status: 400 });

  await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  return NextResponse.json({ ok: true });
}
