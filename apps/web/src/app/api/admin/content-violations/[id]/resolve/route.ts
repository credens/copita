import { currentUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { db } from "@copita/db";
import { NextResponse } from "next/server";

// Para casos de falso positivo — cierra la multa sin que el creador haya
// declarado +18 (a diferencia del auto-resolve de /api/panel/perfil).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await currentUser();
  if (!admin || !isPlatformAdmin(admin.email)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const violation = await db.contentViolation.findUnique({ where: { id } });
  if (!violation) return NextResponse.json({ error: "No existe esa multa" }, { status: 404 });
  if (violation.resolvedAt) return NextResponse.json({ ok: true });

  await db.contentViolation.update({ where: { id }, data: { resolvedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
