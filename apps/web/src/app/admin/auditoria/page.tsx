import { currentUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { db } from "@copita/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminAuditoriaPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isPlatformAdmin(user.email)) notFound();

  const entries = await db.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { admin: { select: { email: true } } },
  });

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <p>
        <Link href="/admin">← Panel interno</Link>
      </p>
      <h1>Auditoría</h1>
      <p style={{ color: "#55504a" }}>Últimas {entries.length} acciones de administradores — quién entró y qué hizo una vez adentro.</p>

      <div style={{ overflowX: "auto" }}>
        <table className="receipt">
          <thead>
            <tr>
              <th>Cuándo</th>
              <th>Admin</th>
              <th>Acción</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.createdAt.toLocaleString("es-AR")}</td>
                <td>{entry.admin.email}</td>
                <td>{entry.action}</td>
                <td>
                  {entry.targetType && (
                    <span className="mono">
                      {entry.targetType}:{entry.targetId}
                    </span>
                  )}
                  {entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : ""}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4}>Todavía no hay acciones registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
