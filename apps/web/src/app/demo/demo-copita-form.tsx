"use client";

import { useState } from "react";
import Link from "next/link";

// Misma UI que el formulario real ([username]/copita-form.tsx), pero no le
// pega a ningún endpoint — es solo para mostrar cómo se ve.
export function DemoCopitaForm({ priceUsd }: { priceUsd: number }) {
  const [quantity, setQuantity] = useState(1);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="card">
        <p style={{ margin: 0 }}>
          Esto es una demo — acá no se cobra nada de verdad. <Link href="/registro">Creá tu perfil</Link> para tener el tuyo.
        </p>
      </div>
    );
  }

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <h3 style={{ marginTop: 0 }}>Invitar una copita</h3>
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
        <label htmlFor="demo-name">Tu nombre (opcional)</label>
        <input id="demo-name" maxLength={80} placeholder="Ej: Juli" />
      </div>
      <div className="field">
        <label htmlFor="demo-message">Mensaje público (opcional)</label>
        <textarea id="demo-message" maxLength={280} rows={3} placeholder="Ej: amo tus streams!" />
      </div>
      <button type="submit" className="btn btn-primary btn-block">
        Pagar con Mercado Pago
      </button>
    </form>
  );
}
