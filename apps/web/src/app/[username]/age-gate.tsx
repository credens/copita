import { cookies } from "next/headers";
import Link from "next/link";

function cookieName(username: string) {
  return `copita-age-gate-${username}`;
}

// Chequeo 100% server-side (cookie, no sessionStorage): si esto viviera en un
// Client Component que solo esconde `children` con CSS/estado, Next igual
// mandaría el contenido completo (nombre, bio, mensajes) en el payload de
// hidratación del HTML — visualmente oculto, pero presente en el response.
// Devolver antes de construir esa JSX es la única forma de que no viaje.
export async function isAgeGateConfirmed(username: string) {
  const jar = await cookies();
  return jar.get(cookieName(username))?.value === "yes";
}

export function AgeGateScreen({ username }: { username: string }) {
  return (
    <div className="container" style={{ maxWidth: 460, paddingTop: 80, paddingBottom: 80, textAlign: "center" }}>
      <div className="card">
        <span className="tag">+18</span>
        <h1 style={{ marginTop: 12 }}>Contenido para mayores de edad</h1>
        <p>Este creador marcó su perfil como contenido para mayores de 18 años. Esto lo declara el propio creador, Copita no lo verifica.</p>
        <form action="/api/age-gate/confirm" method="post" style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
          <input type="hidden" name="username" value={username} />
          <input type="hidden" name="redirectTo" value={`/${username}`} />
          <button type="submit" className="btn btn-primary">
            Soy mayor de 18 años
          </button>
          <Link href="/" className="btn">
            Volver al inicio
          </Link>
        </form>
      </div>
    </div>
  );
}
