import { currentUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/secrets";
import { db } from "@copita/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || state !== request.cookies.get("mp_oauth_state")?.value) return NextResponse.json({ error: "OAuth state inválido" }, { status: 400 });
  const redirectUri = `${process.env.APP_URL}/api/integrations/mercadopago/callback`;
  const body = new URLSearchParams({
    client_id: process.env.MP_CLIENT_ID ?? "",
    client_secret: process.env.MP_CLIENT_SECRET ?? "",
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    state,
  });
  const verifier = request.cookies.get("mp_oauth_verifier")?.value;
  if (verifier) body.set("code_verifier", verifier);
  const response = await fetch("https://api.mercadopago.com/oauth/token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const token = (await response.json()) as { access_token?: string; refresh_token?: string; public_key?: string; user_id?: number; expires_in?: number; scope?: string; message?: string };
  if (!response.ok || !token.access_token) return NextResponse.json({ error: token.message ?? "Mercado Pago no autorizó la conexión" }, { status: 422 });
  await db.user.update({
    where: { id: user.id },
    data: {
      mpConnected: true,
      mpScope: token.scope ?? null,
      mpAccessToken: encryptSecret(token.access_token),
      mpRefreshToken: token.refresh_token ? encryptSecret(token.refresh_token) : null,
      mpPublicKey: token.public_key ?? null,
      mpUserId: token.user_id ? String(token.user_id) : null,
      mpTokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
    },
  });
  const result = NextResponse.redirect(new URL("/panel?mp=connected", request.url));
  result.cookies.delete("mp_oauth_state");
  result.cookies.delete("mp_oauth_verifier");
  return result;
}
