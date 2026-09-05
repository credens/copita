import { db } from "@copita/db";
import Link from "next/link";

// Sin esto, Next la detecta como estática (sin cookies/headers/searchParams)
// y la congela con los creadores que existían en el momento del build. Se
// eligió force-dynamic (siempre en vivo) en vez de `revalidate` para no
// depender de una base alcanzable durante el build — necesario para poder
// buildear la imagen de Docker sin un Postgres real a mano.
export const dynamic = "force-dynamic";

// Fase 7 (scaffold funcional): lista simple de creadores conectados. Falta
// buscador por texto, categorías reales y paginación — hoy es un `take: 60`.
export default async function ExplorarPage() {
  const creators = await db.user.findMany({
    where: { mpConnected: true },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { username: true, name: true, bio: true, avatarUrl: true, tags: true },
  });

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <h1>Explorar creadores</h1>
      {creators.length === 0 && <p>Todavía no hay creadores activos.</p>}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {creators.map((creator) => (
          <Link key={creator.username} href={`/${creator.username}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creator.avatarUrl ?? `https://api.dicebear.com/9.x/shapes/svg?seed=${creator.username}`}
              alt={creator.name}
              width={56}
              height={56}
              className="avatar"
            />
            <h3 style={{ margin: "12px 0 4px" }}>{creator.name}</h3>
            <p className="mono" style={{ margin: 0, fontSize: 13, color: "#55504a" }}>
              @{creator.username}
            </p>
            {creator.bio && <p style={{ fontSize: 14 }}>{creator.bio.slice(0, 100)}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
