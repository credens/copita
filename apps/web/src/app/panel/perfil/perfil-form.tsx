"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Datos ya serializados a tipos planos (los Decimal de Prisma no cruzan el
// límite Server -> Client Component) — ver PerfilPage, que hace el mapeo.
export type PerfilFormUser = {
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  tags: string[];
  copitaPriceUsd: number;
  subscriptionEnabled: boolean;
  subscriptionPriceUsd: number | null;
};

export function PerfilForm({ user }: { user: PerfilFormUser }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(user.subscriptionEnabled);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      bio: form.get("bio"),
      avatarUrl: form.get("avatarUrl"),
      bannerUrl: form.get("bannerUrl"),
      tags: form.get("tags"),
      copitaPriceUsd: form.get("copitaPriceUsd"),
      subscriptionEnabled: form.get("subscriptionEnabled") === "on",
      subscriptionPriceUsd: form.get("subscriptionPriceUsd"),
    };
    const response = await fetch("/api/panel/perfil", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "No se pudo guardar");
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card">
      {error && <div className="error-banner">{error}</div>}
      {saved && <div className="notice-banner">Guardado ✓</div>}
      <div className="field">
        <label htmlFor="name">Nombre público</label>
        <input id="name" name="name" defaultValue={user.name} required minLength={2} maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" defaultValue={user.bio ?? ""} rows={3} maxLength={500} />
      </div>
      <div className="field">
        <label htmlFor="tags">Tags (separados por coma)</label>
        <input id="tags" name="tags" defaultValue={user.tags.join(", ")} placeholder="música, streaming, arte" />
      </div>
      <div className="field">
        <label htmlFor="avatarUrl">URL del avatar</label>
        <input id="avatarUrl" name="avatarUrl" defaultValue={user.avatarUrl ?? ""} placeholder="https://..." />
      </div>
      <div className="field">
        <label htmlFor="bannerUrl">URL del banner</label>
        <input id="bannerUrl" name="bannerUrl" defaultValue={user.bannerUrl ?? ""} placeholder="https://..." />
      </div>
      <div className="field">
        <label htmlFor="copitaPriceUsd">Precio de una copita (USD de referencia)</label>
        <input id="copitaPriceUsd" name="copitaPriceUsd" type="number" step="0.5" min="0.5" defaultValue={Number(user.copitaPriceUsd)} required />
      </div>
      <div className="field">
        <label>
          <input type="checkbox" name="subscriptionEnabled" defaultChecked={user.subscriptionEnabled} onChange={(e) => setSubscriptionEnabled(e.target.checked)} /> Activar Club de
          Copita (suscripción mensual)
        </label>
      </div>
      {subscriptionEnabled && (
        <div className="field">
          <label htmlFor="subscriptionPriceUsd">Precio mensual del club (USD de referencia)</label>
          <input id="subscriptionPriceUsd" name="subscriptionPriceUsd" type="number" step="1" min="1" defaultValue={user.subscriptionPriceUsd ? Number(user.subscriptionPriceUsd) : 5} />
        </div>
      )}
      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
