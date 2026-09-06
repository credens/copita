import { currentUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/platform-admin";
import { accruedFineUsd, outstandingFineUsd } from "@/lib/content-violations";
import { logAdminAction } from "@/lib/audit-log";
import { db } from "@copita/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ContentViolationsPanel } from "./content-violations-panel";

// Fase 6 (scaffold funcional): totales reales de la plataforma. Falta la
// página de estado por creador (conectado / con error de token) y el proceso
// de soporte para pagos rechazados — ver ROADMAP.md Fase 6.
export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!isPlatformAdmin(user.email)) notFound();

  await logAdminAction(user.id, "dashboard_viewed");

  const [collected, pendingCopita, pendingSubscription, copitaCount, activeSubscriptions, creatorCount, activeViolations] = await Promise.all([
    db.commission.aggregate({ where: { status: "COLLECTED" }, _sum: { amount: true } }),
    db.commission.aggregate({ where: { status: "PENDING", copitaId: { not: null } }, _sum: { amount: true } }),
    db.commission.aggregate({ where: { status: "PENDING", subscriptionPaymentId: { not: null } }, _sum: { amount: true } }),
    db.copita.count({ where: { status: "APPROVED" } }),
    db.subscription.findMany({ where: { status: "AUTHORIZED" }, select: { amount: true } }),
    db.user.count({ where: { mpConnected: true } }),
    db.contentViolation.findMany({ where: { resolvedAt: null }, include: { creator: { select: { username: true } } }, orderBy: { detectedAt: "asc" } }),
  ]);

  const mrr = activeSubscriptions.reduce((sum, s) => sum + Number(s.amount), 0);

  const violations = activeViolations.map((v) => ({
    id: v.id,
    username: v.creator.username,
    reason: v.reason,
    detectedAt: v.detectedAt.toISOString(),
    accruedUsd: accruedFineUsd(v),
    outstandingUsd: outstandingFineUsd({ ...v, collectedUsd: Number(v.collectedUsd) }),
  }));

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Panel interno</h1>
        <Link href="/admin/auditoria" className="btn">
          Ver auditoría
        </Link>
      </div>
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

      <h2 style={{ marginTop: 40 }}>Multas por contenido +18 no declarado</h2>
      <ContentViolationsPanel violations={violations} />
    </div>
  );
}
