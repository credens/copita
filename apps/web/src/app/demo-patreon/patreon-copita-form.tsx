"use client";

import { useState } from "react";

export function PatreonCopitaForm({ priceUsd }: { priceUsd: number }) {
  const [quantity, setQuantity] = useState(1);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="pd-card">
        <p style={{ margin: 0 }}>Esto es una demo de estilo — acá no se cobra nada de verdad.</p>
      </div>
    );
  }

  return (
    <form
      className="pd-card"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <h3 style={{ marginTop: 0 }}>Invitar una copita</h3>
      <div className="pd-field">
        <label>Cantidad</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" className="pd-btn pd-btn-secondary" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Restar">
            −
          </button>
          <span style={{ fontSize: 20, minWidth: 24, textAlign: "center", fontWeight: 700 }}>{quantity}</span>
          <button type="button" className="pd-btn pd-btn-secondary" onClick={() => setQuantity((q) => Math.min(50, q + 1))} aria-label="Sumar">
            +
          </button>
          <span className="pd-badge" style={{ marginLeft: "auto" }}>
            ~${(priceUsd * quantity).toFixed(0)} USD
          </span>
        </div>
      </div>
      <div className="pd-field">
        <label htmlFor="pd-name">Tu nombre (opcional)</label>
        <input id="pd-name" maxLength={80} placeholder="Ej: Juli" />
      </div>
      <div className="pd-field">
        <label htmlFor="pd-message">Mensaje público (opcional)</label>
        <textarea id="pd-message" maxLength={280} rows={3} placeholder="Ej: amo tus streams!" />
      </div>
      <button type="submit" className="pd-btn pd-btn-primary" style={{ width: "100%" }}>
        Pagar con Mercado Pago
      </button>
    </form>
  );
}
