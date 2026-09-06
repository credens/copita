import { db } from "@copita/db";
import { decryptSecret, encryptSecret } from "@/lib/secrets";
import { logger } from "@/lib/logger";

type MpAccount = { id: string; mpAccessToken: string | null; mpRefreshToken: string | null; mpTokenExpiresAt: Date | null };

// A cuántos días del vencimiento sellerAccessToken empieza a renovar en vez de
// devolver el token cacheado. Exportado para que el job de background
// (scripts/refresh-mp-tokens.ts) pueda distinguir "no hacía falta tocarlo
// todavía" de una renovación real, en vez de contar cualquier llamada exitosa
// como si hubiera renovado algo.
export const MP_TOKEN_RENEWAL_WINDOW_DAYS = 15;

export function needsTokenRenewal(creator: Pick<MpAccount, "mpTokenExpiresAt">, now = new Date()) {
  return Boolean(creator.mpTokenExpiresAt && creator.mpTokenExpiresAt.getTime() <= now.getTime() + MP_TOKEN_RENEWAL_WINDOW_DAYS * 24 * 60 * 60_000);
}

export type MpConnectionStatus = "not_connected" | "token_error" | "renewal_due" | "connected";

// Para /admin/creadores: no alcanza con mirar mpTokenExpiresAt, porque Mercado
// Pago puede revocar un refresh_token (el creador desconectó la app desde su
// cuenta de MP, por ejemplo) sin que el access_token todavía haya vencido —
// eso solo se descubre al intentar renovar, y mpTokenError es donde queda ese
// resultado.
export function mpConnectionStatus(
  creator: Pick<MpAccount, "mpAccessToken" | "mpTokenExpiresAt"> & { mpConnected: boolean; mpTokenError?: string | null },
  now = new Date(),
): MpConnectionStatus {
  if (!creator.mpConnected || !creator.mpAccessToken) return "not_connected";
  if (creator.mpTokenError) return "token_error";
  if (needsTokenRenewal(creator, now)) return "renewal_due";
  return "connected";
}

async function recordTokenError(creatorId: string, message: string) {
  await db.user.update({ where: { id: creatorId }, data: { mpTokenError: message, mpTokenErrorAt: new Date() } });
}

export async function sellerAccessToken(creator: MpAccount) {
  if (!creator.mpAccessToken) throw new Error("Mercado Pago no está conectado");
  if (!needsTokenRenewal(creator)) return decryptSecret(creator.mpAccessToken);
  if (!creator.mpRefreshToken) {
    logger.error("mercadopago.token_refresh_missing_refresh_token", { creatorId: creator.id });
    await recordTokenError(creator.id, "Falta el refresh token — hace falta reconectar Mercado Pago");
    throw new Error("Mercado Pago requiere reconexión");
  }
  const body = new URLSearchParams({
    client_id: process.env.MP_CLIENT_ID ?? "",
    client_secret: process.env.MP_CLIENT_SECRET ?? "",
    grant_type: "refresh_token",
    refresh_token: decryptSecret(creator.mpRefreshToken),
  });
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const token = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; message?: string };
  if (!response.ok || !token.access_token) {
    // Un creador con esto roto no puede cobrar hasta reconectar — es
    // exactamente el tipo de falla silenciosa que antes no se enteraba nadie.
    const message = token.message ?? "No se pudo renovar Mercado Pago";
    logger.error("mercadopago.token_refresh_failed", { creatorId: creator.id, status: response.status, message });
    await recordTokenError(creator.id, message);
    throw new Error(message);
  }
  await db.user.update({
    where: { id: creator.id },
    data: {
      mpConnected: true,
      mpScope: token.scope,
      mpAccessToken: encryptSecret(token.access_token),
      ...(token.refresh_token ? { mpRefreshToken: encryptSecret(token.refresh_token) } : {}),
      mpTokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
      mpTokenError: null,
      mpTokenErrorAt: null,
    },
  });
  return token.access_token;
}
