import { currentUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { logAdminAction } from "@/lib/audit-log";
import { mpConnectionStatus, type MpConnectionStatus } from "@/lib/mercadopago";
import { db } from "@copita/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

const STATUS_LABEL: Record<MpConnectionStatus, string> = {
  token_error: "Error de token — necesita reconectar",
  renewal_due: "Por vencer pronto",
  not_connected: "No conectado a Mercado Pago",
  connected: "Conectado",
};

const STATUS_ORDER: Record<MpConnectionStatus, number> = {
  token_error: 0,
  renewal_due: 1,
  not_connected: 2,
  connected: 3,
};

export default async function AdminCreadoresPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isPlatformAdmin(user.email)) notFound();

  await logAdminAction(user.id, "creators_status_viewed");

  const creators = await db.user.findMany({
    select: { id: true, username: true, email: true, mpConnected: true, mpAccessToken: true, mpTokenExpiresAt: true, mpTokenError: true, mpTokenErrorAt: true },
    orderBy: { username: "asc" },
  });

  const rows = creators
    .map((creator) => ({ ...creator, status: mpConnectionStatus(creator) }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.username.localeCompare(b.username));

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <p>
        <Link href="/admin">← Panel interno</Link>
      </p>
      <h1>Estado de Mercado Pago por creador</h1>
      <p style={{ color: "#55504a" }}>
        {rows.length} creadores. Un token puede estar roto (refresh revocado) sin haber vencido todavía — solo se descubre al intentar renovarlo, ver{" "}
        <span className="mono">scripts/refresh-mp-tokens.ts</span>.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table className="receipt">
          <thead>
            <tr>
              <th>Creador</th>
              <th>Estado</th>
              <th>Token vence</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link href={`/${row.username}`}>@{row.username}</Link>
                  <br />
                  <span style={{ color: "#8a847a", fontSize: "0.85em" }}>{row.email}</span>
                </td>
                <td>
                  <span className={row.status === "token_error" ? "tag tag-danger" : "tag"}>{STATUS_LABEL[row.status]}</span>
                </td>
                <td>{row.mpTokenExpiresAt ? row.mpTokenExpiresAt.toLocaleString("es-AR") : "—"}</td>
                <td>
                  {row.mpTokenError ? (
                    <>
                      <span className="mono">{row.mpTokenError}</span>
                      <br />
                      <span style={{ color: "#8a847a", fontSize: "0.85em" }}>{row.mpTokenErrorAt?.toLocaleString("es-AR")}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4}>Todavía no hay creadores registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
