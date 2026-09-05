import { currentUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ username: z.string().trim().toLowerCase().min(1), reason: z.string().trim().min(5).max(500) });

// Carga manual desde /admin: no hay clasificador de contenido automático,
// esto lo activa un admin humano al detectar +18 no declarado.
export async function POST(request: Request) {
  const admin = await currentUser();
  if (!admin || !isPlatformAdmin(admin.email)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });

  const creator = await db.user.findUnique({ where: { username: parsed.data.username } });
  if (!creator) return NextResponse.json({ error: "No existe ese usuario" }, { status: 404 });

  const existing = await db.contentViolation.findFirst({ where: { creatorId: creator.id, resolvedAt: null } });
  if (existing) return NextResponse.json({ error: "Ya tiene una multa activa" }, { status: 409 });

  await db.contentViolation.create({ data: { creatorId: creator.id, reason: parsed.data.reason } });
  return NextResponse.json({ ok: true });
}
