"use client";

import { useState } from "react";

export function SubscribeButton({ username, priceUsd }: { username: string; priceUsd: number }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = { username, supporterEmail: form.get("supporterEmail"), supporterName: form.get("supporterName") || undefined };
    const response = await fetch("/api/checkout/suscripcion", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setLoading(false);
      return setError(data.error ?? "No se pudo iniciar la suscripción");
    }
    window.location.href = data.checkoutUrl;
  }

  if (!open) {
    return (
      <button className="btn btn-block" onClick={() => setOpen(true)}>
        <span className="badge-club">CLUB</span> Unirme por ~${priceUsd} USD/mes
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ marginTop: 12 }}>
      {error && <div className="error-banner">{error}</div>}
      <div className="field">
        <label htmlFor="supporterName">Tu nombre (opcional)</label>
        <input id="supporterName" name="supporterName" maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="supporterEmail">Tu email</label>
        <input id="supporterEmail" name="supporterEmail" type="email" required />
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? "Redirigiendo..." : "Confirmar suscripción mensual"}
      </button>
    </form>
  );
}
