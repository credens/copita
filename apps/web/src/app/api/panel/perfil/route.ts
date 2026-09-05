import { currentUser } from "@/lib/auth";
import { db } from "@copita/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  avatarUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  bannerUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  tags: z.string().trim().max(200).optional().or(z.literal("")),
  copitaPriceUsd: z.coerce.number().min(0.5).max(1000),
  subscriptionEnabled: z.coerce.boolean().optional(),
  // El input de subscriptionPriceUsd solo se renderiza en el form cuando el
  // checkbox está tildado — cuando no, el cliente manda `null` (no `undefined`,
  // FormData.get de un campo ausente) y hay que tratarlo como "sin valor".
  subscriptionPriceUsd: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().min(1).max(1000).optional(),
  ),
});

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  const data = parsed.data;

  await db.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      bio: data.bio || null,
      avatarUrl: data.avatarUrl || null,
      bannerUrl: data.bannerUrl || null,
      tags: data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 10)
        : [],
      copitaPriceUsd: data.copitaPriceUsd,
      subscriptionEnabled: Boolean(data.subscriptionEnabled),
      subscriptionPriceUsd: data.subscriptionEnabled ? (data.subscriptionPriceUsd ?? null) : null,
    },
  });

  return NextResponse.json({ ok: true });
}
