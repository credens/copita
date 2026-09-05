"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Violation = { id: string; username: string; reason: string; detectedAt: string; accruedUsd: number; outstandingUsd: number };

export function ContentViolationsPanel({ violations }: { violations: Violation[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function flag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    // event.currentTarget se vuelve null después de un await (no queda vivo
    // el resto del ciclo de vida del evento) — hay que guardar la referencia
    // al form ANTES de la llamada async, no leerla después.
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const response = await fetch("/api/admin/content-violations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), reason: form.get("reason") }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "No se pudo cargar la multa");
    formEl.reset();
    router.refresh();
  }

  async function resolve(id: string) {
    setError(null);
    const response = await fetch(`/api/admin/content-violations/${id}/resolve`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setError(data.error ?? "No se pudo resolver");
    router.refresh();
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={flag} className="card" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 24 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="username">Usuario del creador</label>
          <input id="username" name="username" required placeholder="sin @" />
        </div>
        <div className="field" style={{ flex: "1 1 240px", marginBottom: 0 }}>
          <label htmlFor="reason">Motivo</label>
          <input id="reason" name="reason" required minLength={5} maxLength={500} placeholder="ej: fotos +18 en el perfil sin declarar" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Cargando..." : "Marcar +18 no declarado"}
        </button>
      </form>

      {violations.length === 0 ? (
        <p style={{ color: "#55504a" }}>No hay multas activas.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="receipt">
            <thead>
              <tr>
                <th>Creador</th>
                <th>Motivo</th>
                <th>Desde</th>
                <th>Devengado</th>
                <th>Pendiente</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr key={v.id}>
                  <td>@{v.username}</td>
                  <td>{v.reason}</td>
                  <td>{new Date(v.detectedAt).toLocaleDateString("es-AR")}</td>
                  <td>${v.accruedUsd.toLocaleString("es-AR")} USD</td>
                  <td>${v.outstandingUsd.toLocaleString("es-AR")} USD</td>
                  <td>
                    <button type="button" className="btn" onClick={() => resolve(v.id)}>
                      Resolver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
