import Link from "next/link";
import { PatreonDemoStyles } from "../demo-patreon/patreon-styles";

export const metadata = { title: "Copita — Home estilo Patreon", robots: { index: false } };

// Mismo contenido que la home real (apps/web/src/app/page.tsx), con el
// sistema de diseño de Patreon en vez de "Recibo". Exploración visual
// comparativa — ver /demo-patreon para la versión de perfil de creador.
export default function DemoPatreonHomePage() {
  return (
    <div className="patreon-demo">
      <PatreonDemoStyles />

      <div className="pd-banner">
        Exploración de estilo con el DESIGN.md de Patreon — mismo contenido que la home real, look distinto. No es la dirección visual elegida
        para Copita (esa es &ldquo;Recibo&rdquo;). También hay una versión del{" "}
        <Link href="/demo-patreon">perfil de creador con este estilo</Link>.
      </div>

      <nav className="pd-nav">
        <Link href="/demo-patreon-home" className="pd-wordmark">
          ☕ copita
        </Link>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/demo-patreon" className="pd-btn pd-btn-secondary">
            Explorar
          </Link>
          <Link href="/registro" className="pd-btn pd-btn-primary">
            Mi panel
          </Link>
        </div>
      </nav>

      <div className="pd-container" style={{ paddingTop: 32 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
          <div style={{ flex: "1 1 420px" }}>
            <span className="pd-badge">$1 = una copita</span>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "20px 0" }}>Invitá una copita a tus creadores favoritos.</h1>
            <p style={{ fontSize: 18, maxWidth: 480, color: "var(--pd-muted)" }}>
              Copita es micro-mecenazgo simple: convertite en mecenas de quien te gusta con un aporte chico, único o mensual, que llega directo a
              esa persona. Nosotros nos quedamos con una parte chiquita para poder existir.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              <Link href="/registro" className="pd-btn pd-btn-primary">
                Crear mi perfil de creador
              </Link>
              <Link href="/demo-patreon" className="pd-btn pd-btn-secondary">
                Ver un perfil de ejemplo
              </Link>
            </div>
          </div>
          <div className="pd-card" style={{ flex: "1 1 320px", maxWidth: 380 }}>
            <span className="pd-tag">Ejemplo</span>
            <h3 style={{ marginTop: 12 }}>ejemplo@copita.ar</h3>
            <p style={{ color: "var(--pd-muted)" }}>&ldquo;gracias por el stream de anoche!&rdquo;</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--pd-border)" }}>
              <span>1x copita</span>
              <strong>$1.000</strong>
            </div>
          </div>
        </div>

        <section style={{ marginTop: 64, display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div className="pd-card">
            <h3>1. Creá tu cuenta</h3>
            <p style={{ color: "var(--pd-muted)" }}>Registrate gratis y elegí tu usuario — es lo único que necesitás para arrancar.</p>
          </div>
          <div className="pd-card">
            <h3>2. Subí tu contenido</h3>
            <p style={{ color: "var(--pd-muted)" }}>Contale a tus seguidores quién sos: foto, bio y tags desde tu panel.</p>
          </div>
          <div className="pd-card">
            <h3>3. Compartí tu link</h3>
            <p style={{ color: "var(--pd-muted)" }}>copita.ar/tuusuario — tu perfil público con un muro de apoyos.</p>
          </div>
          <div className="pd-card">
            <h3>4. Recibí copitas</h3>
            <p style={{ color: "var(--pd-muted)" }}>Aportes sueltos o un Club de Copita mensual, con mensaje público opcional.</p>
          </div>
        </section>

        <section style={{ marginTop: 48, paddingTop: 16, borderTop: `1px solid var(--pd-border)`, fontSize: 13, color: "var(--pd-muted)" }}>
          <strong>Tus derechos como aportante:</strong> si invitaste una copita o sos socio de un club, podés{" "}
          <Link href="/arrepentimiento">arrepentirte</Link> o <Link href="/baja">dar de baja</Link> cuando quieras — sin trámite ni esperar
          respuesta.
        </section>

        <div style={{ marginTop: 40, textAlign: "center" }}>
          <Link href="/" className="pd-btn pd-btn-secondary">
            ← Ver la home real (&ldquo;Recibo&rdquo;)
          </Link>
        </div>
      </div>
    </div>
  );
}
