"use client";

import { useState } from "react";
import Link from "next/link";

export function DemoSubscribeButton({ priceUsd }: { priceUsd: number }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button className="btn btn-block" onClick={() => setOpen(true)}>
        <span className="badge-club">CLUB</span> Unirme por ~${priceUsd} USD/mes
      </button>
    );
  }

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <p style={{ margin: 0 }}>
        Esto es una demo — acá no se cobra nada de verdad. <Link href="/registro">Creá tu perfil</Link> para tener tu propio Club de Copita.
      </p>
    </div>
  );
}
