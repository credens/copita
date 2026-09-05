"use client";

import { useState } from "react";
import Link from "next/link";
import { WITHDRAWAL_WINDOW_DAYS } from "@/lib/consumer-rights";

type Copita = {
  id: string;
  creatorName: string;
  creatorUsername: string;
  amount: number;
  createdAt: string;
  withinWindow: boolean;
  deadline: string;
};

export default function ArrepentimientoPage() {
  const [email, setEmail] = useState("");
  const [copitas, setCopitas] = useState<Copita[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [subscriptionsCancelledById, setSubscriptionsCancelledById] = useState<Record<string, number>>({});
  const [subscriptionCancelWarning, setSubscriptionCancelWarning] = useState(false);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setCopitas(null);
    const response = await fetch("/api/self-service/copitas/lookup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "No se pudo buscar");
    setCopitas(data.copitas);
  }

  async function refund(id: string) {
    setRefundingId(id);
    setError(null);
    const response = await fetch("/api/self-service/copitas/refund", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ copitaId: id, email }) });
    const data = (await response.json().catch(() => ({}))) as { error?: string; subscriptionsCancelled?: number; subscriptionCancelFailed?: boolean };
    setRefundingId(null);
    setConfirmingId(null);
    if (!response.ok) return setError(data.error ?? "No se pudo procesar el reembolso");
    setDoneIds((current) => [...current, id]);
    if (data.subscriptionsCancelled) setSubscriptionsCancelledById((current) => ({ ...current, [id]: data.subscriptionsCancelled! }));
    if (data.subscriptionCancelFailed) setSubscriptionCancelWarning(true);
  }

  return (
    <div className="container" style={{ maxWidth: 640, paddingTop: 40, paddingBottom: 56 }}>
      <span className="tag">Arrepentimiento</span>
      <h1>Pedir reembolso de una copita</h1>
      <p style={{ maxWidth: 520 }}>
        Tenés derecho a arrepentirte de una copita y pedir el reembolso dentro de los {WITHDRAWAL_WINDOW_DAYS} días corridos de haberla pagado (Ley
        24.240, art. 34). Buscá con el email que usaste para pagar.
      </p>
      <p style={{ maxWidth: 520, color: "#55504a", fontSize: 14 }}>
        Al reembolsar una copita se cancela también, en el mismo momento, cualquier suscripción activa del Club que tengas con ese mismo creador —
        el arrepentimiento deshace todo lo que le compraste, no solo ese pago puntual.
      </p>

      {subscriptionCancelWarning && (
        <div className="error-banner">
          El reembolso se hizo, pero no pudimos cancelar automáticamente una suscripción asociada. Cancelala manualmente en{" "}
          <Link href="/baja">Baja de servicio</Link>.
        </div>
      )}

      <form onSubmit={search} className="card" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="field" style={{ flex: "1 1 240px", marginBottom: 0 }}>
          <label htmlFor="email">Tu email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="con el que pagaste" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Buscando..." : "Buscar mis copitas"}
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {copitas && copitas.length === 0 && <div className="notice-banner">No encontramos copitas acreditadas con ese email.</div>}

      {copitas && copitas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {copitas.map((c) => {
            const done = doneIds.includes(c.id);
            return (
              <div key={c.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <strong>Copita a @{c.creatorUsername}</strong>
                    <p style={{ margin: "4px 0", color: "#55504a" }}>
                      ${c.amount.toLocaleString("es-AR")} · {new Date(c.createdAt).toLocaleDateString("es-AR")}
                    </p>
                    {!done && !c.withinWindow && <p style={{ margin: 0, color: "var(--coral-ink)", fontSize: 13 }}>Venció el {new Date(c.deadline).toLocaleDateString("es-AR")}</p>}
                    {done && (
                      <p style={{ margin: 0, color: "var(--coral-ink)", fontSize: 13 }}>
                        Reembolso solicitado ✓{subscriptionsCancelledById[c.id] ? " — se canceló también tu suscripción con este creador" : ""}
                      </p>
                    )}
                  </div>
                  {!done && c.withinWindow && (
                    <>
                      {confirmingId === c.id ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                          <p style={{ margin: 0, fontSize: 13, maxWidth: 220, textAlign: "right" }}>Esto también cancela tu suscripción del Club con este creador, si tenés una.</p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn" onClick={() => setConfirmingId(null)}>
                              Volver
                            </button>
                            <button className="btn btn-primary" onClick={() => refund(c.id)} disabled={refundingId === c.id}>
                              {refundingId === c.id ? "Procesando..." : "Confirmar reembolso"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn" onClick={() => setConfirmingId(c.id)}>
                          Pedir reembolso
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
