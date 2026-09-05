import { currentUser } from "@/lib/auth";
import { db } from "@copita/db";
import { redirect } from "next/navigation";

export default async function CopitasHistoryPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [copitas, subscriptions] = await Promise.all([
    db.copita.findMany({ where: { creatorId: user.id }, orderBy: { createdAt: "desc" }, take: 100, include: { commission: true } }),
    db.subscription.findMany({ where: { creatorId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <h1>Historial de copitas</h1>
      <div style={{ overflowX: "auto" }}>
        <table className="receipt">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>De</th>
              <th>Monto</th>
              <th>Comisión</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {copitas.map((copita) => (
              <tr key={copita.id}>
                <td>{copita.createdAt.toLocaleDateString("es-AR")}</td>
                <td>{copita.senderName || copita.senderEmail}</td>
                <td>${Number(copita.amount).toLocaleString("es-AR")}</td>
                <td>${Number(copita.commission?.amount ?? 0).toLocaleString("es-AR")}</td>
                <td>{copita.status}</td>
              </tr>
            ))}
            {copitas.length === 0 && (
              <tr>
                <td colSpan={5}>Todavía no recibiste copitas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 40 }}>Suscripciones del club</h2>
      <div style={{ overflowX: "auto" }}>
        <table className="receipt">
          <thead>
            <tr>
              <th>Desde</th>
              <th>Aportante</th>
              <th>Monto mensual</th>
              <th>Estado</th>
              <th>Próximo cobro</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id}>
                <td>{sub.createdAt.toLocaleDateString("es-AR")}</td>
                <td>{sub.supporterName || sub.supporterEmail}</td>
                <td>${Number(sub.amount).toLocaleString("es-AR")}</td>
                <td>{sub.status}</td>
                <td>{sub.nextBillingDate ? sub.nextBillingDate.toLocaleDateString("es-AR") : "—"}</td>
              </tr>
            ))}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={5}>Todavía no tenés socios del club.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
