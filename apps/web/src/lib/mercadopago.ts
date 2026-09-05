import { db } from "@copita/db";
import { decryptSecret, encryptSecret } from "@/lib/secrets";

type MpAccount = { id: string; mpAccessToken: string | null; mpRefreshToken: string | null; mpTokenExpiresAt: Date | null };

export async function sellerAccessToken(creator: MpAccount) {
  if (!creator.mpAccessToken) throw new Error("Mercado Pago no está conectado");
  const validBeyondRenewalWindow = !creator.mpTokenExpiresAt || creator.mpTokenExpiresAt.getTime() > Date.now() + 15 * 24 * 60 * 60_000;
  if (validBeyondRenewalWindow) return decryptSecret(creator.mpAccessToken);
  if (!creator.mpRefreshToken) throw new Error("Mercado Pago requiere reconexión");
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
  if (!response.ok || !token.access_token) throw new Error(token.message ?? "No se pudo renovar Mercado Pago");
  await db.user.update({
    where: { id: creator.id },
    data: {
      mpConnected: true,
      mpScope: token.scope,
      mpAccessToken: encryptSecret(token.access_token),
      ...(token.refresh_token ? { mpRefreshToken: encryptSecret(token.refresh_token) } : {}),
      mpTokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
    },
  });
  return token.access_token;
}
