import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
        <div style={{ flex: "1 1 420px" }}>
          <span className="sticker">$1 = una copita</span>
          <h1 style={{ fontSize: 44, lineHeight: 1.1, margin: "20px 0" }}>Invitá una copita a tus creadores favoritos.</h1>
          <p style={{ fontSize: 18, maxWidth: 480 }}>
            Copita es micro-mecenazgo simple: un aporte chico, único o mensual, que va directo a la cuenta de Mercado Pago del creador. Nosotros
            solo nos quedamos con una comisión chica en el mismo cobro.
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
              <tr>
                <td>comisión Copita (5%)</td>
                <td style={{ textAlign: "right" }}>-$50</td>
              </tr>
              <tr>
                <td>
                  <strong>Recibe el creador</strong>
                </td>
                <td style={{ textAlign: "right" }}>
                  <strong>$950</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <section style={{ marginTop: 64, display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="card">
          <h3>1. Conectá tu Mercado Pago</h3>
          <p>El creador conecta su propia cuenta. Copita nunca ve ni mueve esa plata.</p>
        </div>
        <div className="card">
          <h3>2. Compartí tu link</h3>
          <p>
            <span className="mono">copita.ar/tuusuario</span> — tu perfil público con un muro de apoyos.
          </p>
        </div>
        <div className="card">
          <h3>3. Recibí copitas</h3>
          <p>Aportes sueltos o un Club de Copita mensual, con mensaje público opcional.</p>
        </div>
      </section>
    </div>
  );
}
