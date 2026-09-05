import { createHash, randomBytes } from "node:crypto";
import { db, AuthTokenType } from "@copita/db";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function issueAuthToken(userId: string, type: AuthTokenType, minutes: number) {
  await db.authToken.deleteMany({ where: { userId, type, OR: [{ usedAt: { not: null } }, { expiresAt: { lt: new Date() } }] } });
  const raw = randomBytes(32).toString("hex");
  await db.authToken.create({ data: { userId, type, tokenHash: hash(raw), expiresAt: new Date(Date.now() + minutes * 60_000) } });
  return raw;
}

export async function consumeAuthToken(raw: string, type: AuthTokenType) {
  return db.$transaction(async (tx) => {
    const token = await tx.authToken.findUnique({ where: { tokenHash: hash(raw) } });
    if (!token || token.type !== type || token.usedAt || token.expiresAt <= new Date()) return null;
    await tx.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
    return token.userId;
  });
}
