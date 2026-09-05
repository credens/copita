"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function RestablecerContrasenaPage() {
  return (
    <Suspense>
      <RestablecerContrasenaForm />
    </Suspense>
  );
}

function RestablecerContrasenaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password: form.get("password") }) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "No se pudo restablecer la contraseña");
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (!token) {
    return (
      <div className="container" style={{ maxWidth: 420, paddingTop: 48, paddingBottom: 48 }}>
        <div className="error-banner">Este enlace no es válido. Pedí uno nuevo desde recuperar contraseña.</div>
        <Link href="/recuperar-contrasena" className="btn btn-primary">
          Recuperar contraseña
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 48, paddingBottom: 48 }}>
      <h1>Elegir nueva contraseña</h1>
      {done ? (
        <div className="notice-banner">Listo, ya podés ingresar con tu nueva contraseña.</div>
      ) : (
        <form onSubmit={onSubmit} className="card">
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label htmlFor="password">Nueva contraseña</label>
            <input id="password" name="password" type="password" required minLength={8} maxLength={128} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      )}
    </div>
  );
}
