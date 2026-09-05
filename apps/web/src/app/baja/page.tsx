"use client";

import { useState } from "react";

type Subscription = {
  id: string;
  creatorName: string;
  creatorUsername: string;
  amount: number;
  status: "PENDING" | "AUTHORIZED" | "PAUSED";
  nextBillingDate: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<Subscription["status"], string> = { PENDING: "Pendiente de autorizar", AUTHORIZED: "Activa", PAUSED: "Pausada" };

export default function BajaDeServicioPage() {
  const [email, setEmail] = useState("");
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setSubscriptions(null);
    const response = await fetch("/api/self-service/subscriptions/lookup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "No se pudo buscar");
    setSubscriptions(data.subscriptions);
  }

  async function cancel(id: string) {
    setCancellingId(id);
    setError(null);
    const response = await fetch("/api/self-service/subscriptions/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subscriptionId: id, email }) });
    const data = await response.json().catch(() => ({}));
    setCancellingId(null);
    setConfirmingId(null);
    if (!response.ok) return setError(data.error ?? "No se pudo cancelar");
    setSubscriptions((current) => current?.filter((s) => s.id !== id) ?? null);
  }

  return (
    <div className="container" style={{ maxWidth: 640, paddingTop: 40, paddingBottom: 56 }}>
      <span className="tag">Baja de servicio</span>
      <h1>Cancelar mi suscripción</h1>
      <p style={{ maxWidth: 520 }}>
        Si sos socio del Club de Copita de algún creador, buscá tu suscripción con el email que usaste para pagar y cancelala en el momento — no
        hace falta escribirle al creador ni esperar respuesta.
      </p>

      <form onSubmit={search} className="card" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "1 1 240px", marginBottom: 0 }}>
          <label htmlFor="email">Tu email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="con el que pagaste" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Buscando..." : "Buscar mis suscripciones"}
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {subscriptions && subscriptions.length === 0 && <div className="notice-banner">No encontramos suscripciones activas con ese email.</div>}

      {subscriptions && subscriptions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {subscriptions.map((s) => (
            <div key={s.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <strong>Club de @{s.creatorUsername}</strong>
                  <p style={{ margin: "4px 0", color: "#55504a" }}>
                    ${s.amount.toLocaleString("es-AR")}/mes · {STATUS_LABEL[s.status]}
                  </p>
                </div>
                {confirmingId === s.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => setConfirmingId(null)}>
                      Volver
                    </button>
                    <button className="btn btn-primary" onClick={() => cancel(s.id)} disabled={cancellingId === s.id}>
                      {cancellingId === s.id ? "Cancelando..." : "Confirmar baja"}
                    </button>
                  </div>
                ) : (
                  <button className="btn" onClick={() => setConfirmingId(s.id)}>
                    Cancelar suscripción
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
