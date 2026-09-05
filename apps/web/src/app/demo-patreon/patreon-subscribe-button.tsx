"use client";

import { useState } from "react";

export function PatreonSubscribeButton({ priceUsd }: { priceUsd: number }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="pd-btn pd-btn-secondary" style={{ width: "100%" }} onClick={() => setOpen(true)}>
        <span className="pd-badge" style={{ marginRight: 8 }}>
          CLUB
        </span>
        Unirme por ~${priceUsd} USD/mes
      </button>
    );
  }

  return (
    <div className="pd-card" style={{ marginTop: 12 }}>
      <p style={{ margin: 0 }}>Esto es una demo de estilo — acá no se cobra nada de verdad.</p>
    </div>
  );
}
