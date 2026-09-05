"use client";

import { useState } from "react";

export function EmailVerificationNotice({ verified }: { verified: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (verified || dismissed) return null;

  async function resend() {
    setLoading(true);
    const response = await fetch("/api/auth/resend-verification", { method: "POST" });
    setLoading(false);
    setMessage(response.ok ? "Te enviamos un nuevo enlace." : "No pudimos reenviarlo todavía.");
  }

  return (
    <div className="notice-banner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div>
        <strong>Verificá tu email.</strong> Te ayuda a recuperar la cuenta si alguna vez perdés el acceso.
        {message && (
          <>
            {" "}
            <small>{message}</small>
          </>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn" onClick={resend} disabled={loading}>
          {loading ? "Enviando..." : "Reenviar enlace"}
        </button>
        <button type="button" className="btn" onClick={() => setDismissed(true)} aria-label="Cerrar aviso">
          ×
        </button>
      </div>
    </div>
  );
}
