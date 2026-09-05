"use client";

import { useState } from "react";

export function CopitaForm({ username, priceUsd }: { username: string; priceUsd: number }) {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = {
      username,
      quantity,
      message: form.get("message") || undefined,
      senderName: form.get("senderName") || undefined,
      senderEmail: form.get("senderEmail"),
    };
    const response = await fetch("/api/checkout/copita", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setLoading(false);
      return setError(data.error ?? "No se pudo iniciar el pago");
    }
    window.location.href = data.checkoutUrl;
  }

  return (
    <form onSubmit={onSubmit} className="card">
      <h3 style={{ marginTop: 0 }}>Invitar una copita</h3>
      {error && <div className="error-banner">{error}</div>}
      <div className="field">
        <label>Cantidad de copitas</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" className="btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Restar">
            −
          </button>
          <span className="mono" style={{ fontSize: 20, minWidth: 24, textAlign: "center" }}>
            {quantity}
          </span>
          <button type="button" className="btn" onClick={() => setQuantity((q) => Math.min(50, q + 1))} aria-label="Sumar">
            +
          </button>
          <span className="sticker" style={{ marginLeft: "auto" }}>
            ~${(priceUsd * quantity).toFixed(0)} USD
          </span>
        </div>
      </div>
      <div className="field">
        <label htmlFor="senderName">Tu nombre (opcional)</label>
        <input id="senderName" name="senderName" maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="senderEmail">Tu email</label>
        <input id="senderEmail" name="senderEmail" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="message">Mensaje público (opcional)</label>
        <textarea id="message" name="message" maxLength={280} rows={3} />
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? "Redirigiendo a Mercado Pago..." : "Pagar con Mercado Pago"}
      </button>
    </form>
  );
}
