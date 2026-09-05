"use client";

import { useState } from "react";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDone(false);
    setLoading(true);
    // event.currentTarget se vuelve null después de un await — guardar la
    // referencia antes, no leerla después de la llamada async.
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const body = { currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") };
    const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setError(data.error ?? "No se pudo cambiar la contraseña");
    setDone(true);
    formEl.reset();
  }

  return (
    <form onSubmit={onSubmit} className="card">
      {error && <div className="error-banner">{error}</div>}
      {done && <div className="notice-banner">Contraseña actualizada ✓</div>}
      <div className="field">
        <label htmlFor="currentPassword">Contraseña actual</label>
        <input id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div className="field">
        <label htmlFor="newPassword">Contraseña nueva</label>
        <input id="newPassword" name="newPassword" type="password" required minLength={8} maxLength={128} />
      </div>
      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
