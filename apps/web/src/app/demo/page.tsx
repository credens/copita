import Link from "next/link";
import { DemoCopitaForm } from "./demo-copita-form";
import { DemoSubscribeButton } from "./demo-subscribe-button";

export const metadata = { title: "Copita — Demo de perfil" };

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

export default function DemoPage() {
  return (
    <div>
      <div className="notice-banner" style={{ margin: "16px 20px 0", borderRadius: 4 }}>
        Esta es una página de ejemplo con datos ficticios — así se ve un perfil de creador ya armado.{" "}
        <Link href="/registro">Creá el tuyo</Link>.
      </div>

      <div
        style={{
          height: 180,
          background: "linear-gradient(135deg, var(--coral), var(--paper-alt))",
          borderBottom: "var(--line) solid var(--ink)",
          marginTop: 16,
        }}
      />
      <div className="container" style={{ paddingTop: 0 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", marginTop: -48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://api.dicebear.com/9.x/shapes/svg?seed=${DEMO_CREATOR.username}`} alt={DEMO_CREATOR.name} width={96} height={96} className="avatar" />
          <div style={{ paddingBottom: 8 }}>
            <h1 style={{ margin: 0 }}>{DEMO_CREATOR.name}</h1>
            <p className="mono" style={{ margin: 0, color: "#55504a" }}>
              @{DEMO_CREATOR.username}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {DEMO_CREATOR.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>

        <p style={{ maxWidth: 560, marginTop: 16 }}>{DEMO_CREATOR.bio}</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, marginTop: 32 }}>
          <div style={{ flex: "1 1 320px", maxWidth: 400 }}>
            <DemoCopitaForm priceUsd={DEMO_CREATOR.copitaPriceUsd} />
            <div style={{ marginTop: 16 }}>
              <DemoSubscribeButton priceUsd={DEMO_CREATOR.subscriptionPriceUsd} />
            </div>
          </div>

          <div style={{ flex: "2 1 420px" }}>
            <h3>Muro de apoyos</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {DEMO_WALL.map((copita, index) => (
                <div key={index} className="card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{copita.name}</strong>
                    <span className="mono">{copita.quantity}x ☕</span>
                  </div>
                  {copita.message && <p style={{ margin: "8px 0 0" }}>{copita.message}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 40, marginBottom: 40, textAlign: "center" }}>
          <Link href="/registro" className="btn btn-primary">
            Crear mi propio perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
