"use client";

import { ChangeEvent, useState } from "react";
import { optimizeImage } from "@/lib/image-optimize";

const MAX_BYTES = 5 * 1024 * 1024;

export function ImageUploader({ name, label, kind, initialUrl }: { name: string; label: string; kind: "avatar" | "banner"; initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function select(event: ChangeEvent<HTMLInputElement>) {
    const original = event.target.files?.[0];
    event.target.value = "";
    if (!original) return;
    setUploading(true);
    setError("");
    const previousUrl = url;
    try {
      const file = await optimizeImage(original, MAX_BYTES);
      const sign = await fetch("/api/panel/uploads/presign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contentType: file.type, size: file.size, kind }) });
      const data = await sign.json();
      if (!sign.ok) throw new Error(data.error ?? "No se pudo preparar la carga");
      const put = await fetch(data.uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
      if (!put.ok) throw new Error("El storage rechazó la imagen");
      setUrl(data.publicUrl);
      if (previousUrl) await fetch("/api/panel/uploads/delete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: previousUrl, kind }) }).catch(() => undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="field">
      <label htmlFor={`upload-${name}`}>{label}</label>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" style={{ display: "block", maxWidth: 200, maxHeight: 120, objectFit: "cover", borderRadius: 4, border: "2px solid var(--ink)", marginBottom: 8 }} />
      )}
      <input id={`upload-${name}`} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={select} disabled={uploading} />
      <input type="hidden" name={name} value={url} />
      <p style={{ fontSize: 12, color: "#55504a", margin: "4px 0 0" }}>{uploading ? "Subiendo..." : `Máximo ${MAX_BYTES / 1024 / 1024} MB · se optimiza automáticamente`}</p>
      {error && <p style={{ fontSize: 12, color: "var(--coral-ink)", margin: "4px 0 0" }}>{error}</p>}
    </div>
  );
}
