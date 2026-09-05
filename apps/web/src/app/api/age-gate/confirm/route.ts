import { NextRequest, NextResponse } from "next/server";

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/;

// Confirma el aviso de +18 vía form POST plano (sin JS) y guarda una cookie
// de sesión (sin maxAge => se borra al cerrar el navegador) — ver age-gate.tsx
// para por qué esto tiene que resolverse en el servidor y no con sessionStorage.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const redirectTo = String(form.get("redirectTo") ?? "/");
  const safeRedirect = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";

  if (!USERNAME_RE.test(username)) return NextResponse.json({ error: "Usuario inválido" }, { status: 400 });

  const response = NextResponse.redirect(new URL(safeRedirect, request.url));
  response.cookies.set(`copita-age-gate-${username}`, "yes", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return response;
}
