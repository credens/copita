"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegistroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      username: form.get("username"),
    };
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "No se pudo crear la cuenta");
    router.push("/panel");
    router.refresh();
  }

  return (
    <div className="container" style={{ maxWidth: 480, paddingTop: 48, paddingBottom: 48 }}>
      <h1>Creá tu perfil</h1>
      <p style={{ marginBottom: 24 }}>
        Vas a poder conectar Mercado Pago y elegir tu link público (<span className="mono">copita.ar/tuusuario</span>) desde tu panel.
      </p>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input id="name" name="name" required minLength={2} maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="username">Usuario (copita.ar/...)</label>
          <input id="username" name="username" required minLength={3} maxLength={30} pattern="[a-z0-9-]+" placeholder="tunombre" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" required minLength={8} maxLength={128} />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Creando..." : "Crear mi perfil"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        ¿Ya tenés cuenta? <Link href="/login">Ingresá</Link>
      </p>
    </div>
  );
}
