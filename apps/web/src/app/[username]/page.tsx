import { db } from "@copita/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CopitaForm } from "./copita-form";
import { SubscribeButton } from "./subscribe-button";
import { AgeGateScreen, isAgeGateConfirmed } from "./age-gate";

// Consulta aparte de la de abajo (liviana, solo estos campos) porque
// generateMetadata corre en paralelo a la página, no adentro — no hay forma
// de reusar acá lo que trae CreatorProfilePage.
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const creator = await db.user.findUnique({ where: { username }, select: { name: true, username: true, bio: true, avatarUrl: true, matureContent: true } });
  if (!creator) return {};

  // Mismo cuidado que el age-gate de la página: un crawler nunca tiene la
  // cookie de confirmación, así que acá SIEMPRE hay que tratarlo como no
  // confirmado — mostrar el nombre/bio real en una preview de link sería el
  // mismo data leak que ya se corrigió en el cuerpo de la página.
  if (creator.matureContent) {
    return { title: `@${creator.username} — Copita`, description: "Este perfil tiene contenido para mayores de 18 años." };
  }

  const description = creator.bio?.trim().slice(0, 160) || `Invitale una copita a ${creator.name} en Copita.`;
  const appUrl = process.env.APP_URL;
  const url = appUrl ? `${appUrl}/${creator.username}` : undefined;
  const images = creator.avatarUrl ? [creator.avatarUrl] : undefined;

  return {
    title: `${creator.name} (@${creator.username}) — Copita`,
    description,
    openGraph: { title: creator.name, description, url, images, type: "profile" },
    twitter: { card: "summary", title: creator.name, description, images },
  };
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const creator = await db.user.findUnique({ where: { username } });
  if (!creator) notFound();

  // Corta acá si hace falta el aviso: nada del contenido de abajo (bio,
  // mensajes del muro, etc.) se busca ni se renderiza hasta confirmar.
  if (creator.matureContent && !(await isAgeGateConfirmed(creator.username))) {
    return <AgeGateScreen username={creator.username} />;
  }

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
