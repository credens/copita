"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get("email") === "invalid" ? "Ese enlace de verificación venció o ya se usó." : null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = { email: form.get("email"), password: form.get("password") };
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "No se pudo ingresar");
    router.push("/panel");
    router.refresh();
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 48, paddingBottom: 48 }}>
      <h1>Ingresar</h1>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" required />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        ¿No tenés cuenta? <Link href="/registro">Creá tu perfil</Link>
        <br />
        <Link href="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
      </p>
    </div>
  );
}
