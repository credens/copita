import { db } from "@copita/db";
import { NextResponse } from "next/server";

// Usado por el deploy (scripts/deploy-pm2-release.sh) para confirmar que el
// release nuevo levantó y puede hablar con la base antes de cortar tráfico
// hacia él — si esto no responde 200, el deploy revierte solo.
export async function GET() {
  await db.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true });
}
