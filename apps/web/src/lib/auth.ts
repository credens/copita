import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@copita/db";

export const SESSION_COOKIE = "copita_session";
const maxAge = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is required");
  return value ?? "local-development-secret-change-me";
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionValue(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + maxAge * 1000 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function readSessionValue(value?: string) {
  if (!value) return null;
  const [payload, supplied] = value.split(".");
  if (!payload || !supplied) return null;
  const expected = signature(payload);
  if (supplied.length !== expected.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId: string; expiresAt: number };
    return data.expiresAt > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export function sessionCookie(value: string) {
  return { name: SESSION_COOKIE, value, httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge };
}

export async function currentUser() {
  const session = readSessionValue((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return null;
  return db.user.findUnique({ where: { id: session.userId } });
}
