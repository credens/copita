import { db } from "@copita/db";
import Link from "next/link";
import type { Metadata } from "next";

// Sin esto, Next la detecta como estática (sin cookies/headers/searchParams)
// y la congela con los creadores que existían en el momento del build. Se
// eligió force-dynamic (siempre en vivo) en vez de `revalidate` para no
// depender de una base alcanzable durante el build — necesario para poder
// buildear la imagen de Docker sin un Postgres real a mano.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explorar creadores — Copita",
  description: "Descubrí creadores para apoyar con una copita en Copita.",
};

function matches(creator: { username: string; name: string; bio: string | null; tags: string[] }, query: string) {
  const haystack = `${creator.username} ${creator.name} ${creator.bio ?? ""} ${creator.tags.join(" ")}`.toLowerCase();
  return haystack.includes(query);
}

export default async function ExplorarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  // Sin paginación todavía (ver /admin/creadores y /admin/auditoria — mismo
  // criterio): a esta escala alcanza con traer todo y filtrar en memoria.
  const allCreators = await db.user.findMany({
    where: { mpConnected: true },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { username: true, name: true, bio: true, avatarUrl: true, tags: true },
  });

  const creators = query ? allCreators.filter((creator) => matches(creator, query)) : allCreators;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <h1>Explorar creadores</h1>
      <form method="get" style={{ marginBottom: 24, display: "flex", gap: 8, maxWidth: 420 }}>
        <input type="search" name="q" defaultValue={q ?? ""} placeholder="Buscar por nombre, usuario o tema..." aria-label="Buscar creadores" style={{ flex: 1 }} />
        <button type="submit" className="btn">
          Buscar
        </button>
      </form>

      {query && (
        <p style={{ color: "#55504a" }}>
          {creators.length} {creators.length === 1 ? "resultado" : "resultados"} para &quot;{q}&quot;.{" "}
          <Link href="/explorar">Ver todos</Link>
        </p>
      )}

      {creators.length === 0 && <p>{query ? "No encontramos creadores para esa búsqueda." : "Todavía no hay creadores activos."}</p>}

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
