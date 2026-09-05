import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
        <div style={{ flex: "1 1 420px" }}>
          <span className="sticker">$1 = una copita</span>
          <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: "20px 0" }}>Invitá una copita a tus creadores favoritos.</h1>
          <p style={{ fontSize: 18, maxWidth: 480 }}>
            Copita es micro-mecenazgo simple: convertite en mecenas de quien te gusta con un aporte chico, único o mensual, que llega directo a esa
            persona. Nosotros nos quedamos con una parte chiquita para poder existir.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <Link href="/registro" className="btn btn-primary">
              Crear mi perfil de creador
            </Link>
            <Link href="/explorar" className="btn">
              Explorar creadores
            </Link>
          </div>
        </div>
        <div className="card" style={{ flex: "1 1 320px", maxWidth: 380 }}>
          <p className="tag">Recibo</p>
          <h3 style={{ marginTop: 12 }}>ejemplo@copita.ar</h3>
          <p style={{ color: "#55504a" }}>&ldquo;gracias por el stream de anoche!&rdquo;</p>
          <table className="receipt" style={{ marginTop: 16 }}>
            <tbody>
              <tr>
                <td>1x copita</td>
                <td style={{ textAlign: "right" }}>$1.000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <section style={{ marginTop: 64, display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="card">
          <h3>1. Creá tu cuenta</h3>
          <p>Registrate gratis y elegí tu usuario — es lo único que necesitás para arrancar.</p>
        </div>
        <div className="card">
          <h3>2. Subí tu contenido</h3>
          <p>Contale a tus seguidores quién sos: foto, bio y tags desde tu panel.</p>
        </div>
        <div className="card">
          <h3>3. Compartí tu link</h3>
          <p>
            <span className="mono">copita.ar/tuusuario</span> — tu perfil público con un muro de apoyos.
          </p>
        </div>
        <div className="card">
          <h3>4. Recibí copitas</h3>
          <p>Aportes sueltos o un Club de Copita mensual, con mensaje público opcional.</p>
        </div>
      </section>

      <section className="card" style={{ marginTop: 40, borderColor: "var(--ink)" }}>
        <h3 style={{ marginTop: 0 }}>Tus derechos como aportante</h3>
        <p>Si invitaste una copita o sos socio de un club, podés arrepentirte o dar de baja cuando quieras — sin trámite ni esperar respuesta.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <Link href="/arrepentimiento" className="btn">
            ↩ Botón de arrepentimiento
          </Link>
          <Link href="/baja" className="btn">
            ✕ Baja de servicio
          </Link>
        </div>
      </section>
    </div>
  );
}
