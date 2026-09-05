"use client";

import { useState } from "react";
import Link from "next/link";

export default function RecuperarContrasenaPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    await fetch("/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email") }) });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 48, paddingBottom: 48 }}>
      <h1>Recuperar contraseña</h1>
      {sent ? (
        <div className="notice-banner">Si existe una cuenta con ese email, te enviamos un enlace para elegir una contraseña nueva.</div>
      ) : (
        <form onSubmit={onSubmit} className="card">
          <p style={{ marginTop: 0 }}>Ingresá el email de tu cuenta y te mandamos un enlace para restablecerla.</p>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>
      )}
      <p style={{ marginTop: 16 }}>
        <Link href="/login">Volver a ingresar</Link>
      </p>
    </div>
  );
}
