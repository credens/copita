import { currentUser } from "@/lib/auth";
import { deleteOwnedImage, UPLOAD_KINDS } from "@/lib/storage";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ url: z.string().url().max(2000), kind: z.enum(UPLOAD_KINDS) });

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  await deleteOwnedImage({ userId: user.id, kind: parsed.data.kind, url: parsed.data.url }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
