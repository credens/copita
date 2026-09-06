import type { MetadataRoute } from "next";
import { db } from "@copita/db";

export const dynamic = "force-dynamic";

// Mismo criterio que /explorar y el age-gate: un perfil +18 no se lista acá
// (no queremos que un buscador lo indexe fuera del aviso), y solo entran los
// creadores que de verdad se pueden apoyar (mpConnected).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const creators = await db.user.findMany({
    where: { mpConnected: true, matureContent: false },
    select: { username: true, updatedAt: true },
  });

  return [
    { url: appUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${appUrl}/explorar`, changeFrequency: "daily", priority: 0.8 },
    ...creators.map((creator) => ({
      url: `${appUrl}/${creator.username}`,
      lastModified: creator.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
