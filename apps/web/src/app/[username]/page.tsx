import { db } from "@copita/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CopitaForm } from "./copita-form";
import { SubscribeButton } from "./subscribe-button";

export default async function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const creator = await db.user.findUnique({ where: { username } });
  if (!creator) notFound();

  const recentCopitas = await db.copita.findMany({
    where: { creatorId: creator.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <div
        style={{
          height: 180,
          background: creator.bannerUrl ? `url(${creator.bannerUrl}) center/cover` : "var(--paper-alt)",
          borderBottom: "var(--line) solid var(--ink)",
        }}
      />
      <div className="container" style={{ paddingTop: 0 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", marginTop: -48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creator.avatarUrl ?? `https://api.dicebear.com/9.x/shapes/svg?seed=${creator.username}`}
            alt={creator.name}
            width={96}
            height={96}
            className="avatar"
          />
          <div style={{ paddingBottom: 8 }}>
            <h1 style={{ margin: 0 }}>{creator.name}</h1>
            <p className="mono" style={{ margin: 0, color: "#55504a" }}>
              @{creator.username}
            </p>
          </div>
        </div>

        {creator.tags.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {creator.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {creator.bio && <p style={{ maxWidth: 560, marginTop: 16 }}>{creator.bio}</p>}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 32 }}>
          <div style={{ flex: "1 1 320px", maxWidth: 400 }}>
            {creator.mpConnected ? (
              <>
                <CopitaForm username={creator.username} priceUsd={Number(creator.copitaPriceUsd)} />
                {creator.subscriptionEnabled && creator.subscriptionPriceUsd && (
                  <div style={{ marginTop: 16 }}>
                    <SubscribeButton username={creator.username} priceUsd={Number(creator.subscriptionPriceUsd)} />
                  </div>
                )}
              </>
            ) : (
              <div className="notice-banner">Este creador todavía no conectó Mercado Pago — no puede recibir copitas por ahora.</div>
            )}
            {creator.subscriptionEnabled && (
              <p style={{ marginTop: 12 }}>
                <Link href={`/${creator.username}/club`}>Ver contenido del club →</Link>
              </p>
            )}
          </div>

          <div style={{ flex: "2 1 420px" }}>
            <h3>Muro de apoyos</h3>
            {recentCopitas.length === 0 && <p style={{ color: "#55504a" }}>Todavía no hay copitas — ¡sé el primero!</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentCopitas.map((copita) => (
                <div key={copita.id} className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{copita.senderName || "Anónimo"}</strong>
                    <span className="mono">{copita.quantity}x ☕</span>
                  </div>
                  {copita.message && <p style={{ margin: "8px 0 0" }}>{copita.message}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
