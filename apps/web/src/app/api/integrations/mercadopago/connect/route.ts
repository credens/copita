import { currentUser } from "@/lib/auth";
import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));
  const clientId = process.env.MP_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!clientId || !appUrl) return NextResponse.json({ error: "Faltan MP_CLIENT_ID y APP_URL" }, { status: 503 });
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri = `${appUrl}/api/integrations/mercadopago/callback`;
  const url = new URL("https://auth.mercadopago.com/authorization");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  const response = NextResponse.redirect(url);
  response.cookies.set("mp_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  response.cookies.set("mp_oauth_verifier", verifier, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return response;
}
