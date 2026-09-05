import { currentUser } from "@/lib/auth";
import { createImageUpload, IMAGE_CONTENT_TYPES, MAX_IMAGE_BYTES, UPLOAD_KINDS } from "@/lib/storage";
import { NextResponse } from "next/server";
import { z } from "zod";
import { distributedRateLimit } from "@/lib/distributed-rate-limit";

const schema = z.object({ contentType: z.enum(IMAGE_CONTENT_TYPES), size: z.number().int().positive().max(MAX_IMAGE_BYTES), kind: z.enum(UPLOAD_KINDS) });

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const limit = await distributedRateLimit(`upload:${user.id}`, 30, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Demasiadas cargas. Esperá un momento" }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: `Imagen inválida. Usá JPG, PNG, WebP o GIF de hasta ${MAX_IMAGE_BYTES / 1024 / 1024} MB.` }, { status: 400 });

  try {
    return NextResponse.json(await createImageUpload({ userId: user.id, kind: parsed.data.kind, contentType: parsed.data.contentType, contentLength: parsed.data.size }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo preparar la carga" }, { status: 503 });
  }
}
