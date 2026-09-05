import { db } from "@copita/db";
import { notFound } from "next/navigation";

// Fase 5 (scaffold): hoy solo lista los posts públicos. El contenido marcado
// como CLUB necesita resolver primero verificación de membresía activa del
// visitante (sesión de aportante, no solo de creador) antes de mostrarse.
export default async function ClubPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const creator = await db.user.findUnique({ where: { username } });
  if (!creator) notFound();

  const posts = await db.post.findMany({ where: { creatorId: creator.id, visibility: "PUBLIC" }, orderBy: { createdAt: "desc" } });

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <h1>Club de @{creator.username}</h1>
      <div className="notice-banner">
        Borrador (Fase 5): todavía no hay control de acceso por membresía activa — todo lo que se ve acá es contenido público. Falta modelar la sesión
        del aportante para desbloquear posts marcados como &ldquo;solo socios&rdquo;.
      </div>
      {posts.length === 0 && <p>Este creador todavía no publicó nada.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {posts.map((post) => (
          <article key={post.id} className="card">
            <h3 style={{ marginTop: 0 }}>{post.title}</h3>
            <p>{post.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
