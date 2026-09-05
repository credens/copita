import { db } from "@copita/db";

export async function distributedRateLimit(key: string, limit: number, windowMs: number) {
  const reset = new Date(Date.now() + windowMs);
  const rows = await db.$queryRaw<Array<{ count: number; resetAt: Date }>>`
INSERT INTO "RequestLimit" (key,count,"resetAt","updatedAt") VALUES (${key},1,${reset},NOW())
ON CONFLICT (key) DO UPDATE SET
  count=CASE WHEN "RequestLimit"."resetAt" <= NOW() THEN 1 ELSE "RequestLimit".count+1 END,
  "resetAt"=CASE WHEN "RequestLimit"."resetAt" <= NOW() THEN ${reset} ELSE "RequestLimit"."resetAt" END,
  "updatedAt"=NOW()
RETURNING count,"resetAt"`;
  const row = rows[0];
  return { allowed: row.count <= limit, retryAfter: Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000)) };
}
