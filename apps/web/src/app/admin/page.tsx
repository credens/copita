import { currentUser } from "@/lib/auth";
import { db } from "@copita/db";
import { redirect, notFound } from "next/navigation";

function isPlatformAdmin(email: string) {
  const list = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

// Fase 6 (scaffold funcional): totales reales de la plataforma. Falta la
// página de estado por creador (conectado / con error de token) y el proceso
// de soporte para pagos rechazados — ver ROADMAP.md Fase 6.
export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isPlatformAdmin(user.email)) notFound();

  const [collected, pendingCopita, pendingSubscription, copitaCount, activeSubscriptions, creatorCount] = await Promise.all([
    db.commission.aggregate({ where: { status: "COLLECTED" }, _sum: { amount: true } }),
    db.commission.aggregate({ where: { status: "PENDING", copitaId: { not: null } }, _sum: { amount: true } }),
    db.commission.aggregate({ where: { status: "PENDING", subscriptionPaymentId: { not: null } }, _sum: { amount: true } }),
    db.copita.count({ where: { status: "APPROVED" } }),
    db.subscription.findMany({ where: { status: "AUTHORIZED" }, select: { amount: true } }),
    db.user.count({ where: { mpConnected: true } }),
  ]);

  const mrr = activeSubscriptions.reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <h1>Panel interno</h1>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="card">
          <p className="tag">Comisión cobrada (copitas)</p>
          <h2>${Number(collected._sum.amount ?? 0).toLocaleString("es-AR")}</h2>
        </div>
        <div className="card">
          <p className="tag">Comisión pendiente (copitas)</p>
          <h2>${Number(pendingCopita._sum.amount ?? 0).toLocaleString("es-AR")}</h2>
        </div>
        <div className="card">
          <p className="tag">Comisión pendiente de liquidar (suscripciones)</p>
          <h2>${Number(pendingSubscription._sum.amount ?? 0).toLocaleString("es-AR")}</h2>
        </div>
        <div className="card">
          <p className="tag">Copitas cobradas</p>
          <h2>{copitaCount}</h2>
        </div>
        <div className="card">
          <p className="tag">MRR (suscripciones activas)</p>
          <h2>${mrr.toLocaleString("es-AR")}</h2>
        </div>
        <div className="card">
          <p className="tag">Creadores conectados</p>
          <h2>{creatorCount}</h2>
        </div>
      </div>
    </div>
  );
}
