import Link from "next/link";
import { PatreonCopitaForm } from "./patreon-copita-form";
import { PatreonSubscribeButton } from "./patreon-subscribe-button";

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
      <style>{`
        .patreon-demo {
          --pd-coral: #FF424D;
          --pd-ink: #111111;
          --pd-surface: #FFFFFF;
          --pd-bg: #FFF7F6;
          --pd-muted: #666666;
          --pd-border: #E9DDDA;
          background: var(--pd-bg);
          font-family: Inter, "Helvetica Neue", system-ui, sans-serif;
          color: var(--pd-ink);
          padding-bottom: 64px;
        }
        .patreon-demo h1, .patreon-demo h2, .patreon-demo h3 {
          font-family: Inter, "Helvetica Neue", system-ui, sans-serif;
          font-weight: 700;
        }
        .pd-container { max-width: 960px; margin: 0 auto; padding: 0 24px; }
        .pd-banner { background: var(--pd-ink); color: #fff; font-size: 13px; padding: 10px 24px; text-align: center; }
        .pd-banner a { color: #fff; text-decoration: underline; }
        .pd-hero { height: 200px; background: linear-gradient(135deg, var(--pd-coral), #ffb3b8); }
        .pd-card {
          background: var(--pd-surface);
          border: 1px solid var(--pd-border);
          border-radius: 24px;
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
          padding: 24px;
        }
        .pd-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          border-radius: 999px; min-height: 46px; padding: 0 24px;
          font-weight: 700; font-size: 15px; cursor: pointer; border: none;
          text-decoration: none;
        }
        .pd-btn-primary { background: var(--pd-ink); color: #fff; }
        .pd-btn-secondary { background: #fff; color: var(--pd-ink); border: 1px solid var(--pd-ink); }
        .pd-tag { display: inline-block; background: var(--pd-bg); border: 1px solid var(--pd-border); color: var(--pd-muted); border-radius: 999px; padding: 4px 12px; font-size: 13px; }
        .pd-badge { display: inline-block; background: var(--pd-coral); color: #fff; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 700; }
        .pd-field { margin-bottom: 16px; }
        .pd-field label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: var(--pd-muted); }
        .pd-field input, .pd-field textarea {
          width: 100%; border: 1px solid var(--pd-border); border-radius: 12px; padding: 10px 14px;
          font-family: inherit; font-size: 15px; box-sizing: border-box;
        }
        .pd-avatar { border-radius: 999px; border: 4px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.12); object-fit: cover; }
      `}</style>

      <div className="pd-banner">
        Exploración de estilo con el DESIGN.md de Patreon — mismo contenido que <Link href="/demo">/demo</Link>, look distinto. No es la dirección visual elegida para Copita (esa es &ldquo;Recibo&rdquo;).
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
