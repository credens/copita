import Link from "next/link";
import { PatreonCopitaForm } from "./patreon-copita-form";
import { PatreonSubscribeButton } from "./patreon-subscribe-button";
import { PatreonDemoStyles } from "./patreon-styles";

export const metadata = { title: "Copita — Demo estilo Patreon", robots: { index: false } };

const DEMO_CREATOR = {
  name: "Mica Streams",
  username: "micastreams",
  tags: ["arte digital", "streaming", "ilustración"],
  bio: "Dibujo en vivo los martes y jueves a las 20hs. Cada copita ayuda a que siga haciendo esto full time — gracias por pasar! 🎨",
  copitaPriceUsd: 1,
  subscriptionPriceUsd: 5,
};

const DEMO_WALL = [
  { name: "Juli", quantity: 3, message: "amo tus streams, gracias por compartir el proceso!" },
  { name: "Anónimo", quantity: 1, message: null },
  { name: "Fede", quantity: 5, message: "el diseño del último personaje quedó buenísimo 🔥" },
  { name: "Cami", quantity: 1, message: "recién descubrí tu canal, ya me suscribí al club" },
];

// Exploración visual: mismo contenido que /demo, pero con los tokens del
// DESIGN.md de Patreon (github.com/Khalidabdi1/design-ai) en vez de la
// dirección "Recibo" elegida para el sitio. Estilos acotados a esta página
// con .pd-* — no toca globals.css ni el resto del sitio.
export default function DemoPatreonPage() {
  return (
    <div className="patreon-demo">
      <PatreonDemoStyles />

      <div className="pd-banner">
        Exploración de estilo con el DESIGN.md de Patreon — mismo contenido que <Link href="/demo">/demo</Link>, look distinto. No es la dirección
        visual elegida para Copita (esa es &ldquo;Recibo&rdquo;). También hay una versión de la{" "}
        <Link href="/demo-patreon-home">home con este estilo</Link>.
      </div>

      <div className="pd-hero" />
      <div className="pd-container" style={{ marginTop: -48 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://api.dicebear.com/9.x/shapes/svg?seed=${DEMO_CREATOR.username}`} alt={DEMO_CREATOR.name} width={96} height={96} className="pd-avatar" />
          <div style={{ paddingBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 32 }}>{DEMO_CREATOR.name}</h1>
            <p style={{ margin: 0, color: "var(--pd-muted)" }}>@{DEMO_CREATOR.username}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {DEMO_CREATOR.tags.map((tag) => (
            <span key={tag} className="pd-tag">
              {tag}
            </span>
          ))}
        </div>

        <p style={{ maxWidth: 560, marginTop: 16, color: "var(--pd-muted)", fontSize: 16 }}>{DEMO_CREATOR.bio}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 32 }}>
          <div style={{ flex: "1 1 320px", maxWidth: 400 }}>
            <PatreonCopitaForm priceUsd={DEMO_CREATOR.copitaPriceUsd} />
            <div style={{ marginTop: 16 }}>
              <PatreonSubscribeButton priceUsd={DEMO_CREATOR.subscriptionPriceUsd} />
            </div>
          </div>

          <div style={{ flex: "2 1 420px" }}>
            <h3>Muro de apoyos</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {DEMO_WALL.map((copita, index) => (
                <div key={index} className="pd-card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{copita.name}</strong>
                    <span className="pd-badge">{copita.quantity}x ☕</span>
                  </div>
                  {copita.message && <p style={{ margin: "8px 0 0", color: "var(--pd-muted)" }}>{copita.message}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 48, textAlign: "center", display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/demo" className="pd-btn pd-btn-secondary">
            ← Ver versión &ldquo;Recibo&rdquo;
          </Link>
          <Link href="/registro" className="pd-btn pd-btn-primary">
            Crear mi propio perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
