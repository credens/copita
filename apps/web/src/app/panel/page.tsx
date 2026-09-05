import { currentUser } from "@/lib/auth";
import { db } from "@copita/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PanelPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [copitaStats, activeSubscriptions, pendingCommission] = await Promise.all([
    db.copita.aggregate({ where: { creatorId: user.id, status: "APPROVED" }, _sum: { amount: true }, _count: true }),
    db.subscription.count({ where: { creatorId: user.id, status: "AUTHORIZED" } }),
    db.commission.aggregate({
      where: { status: "PENDING", subscriptionPayment: { subscription: { creatorId: user.id } } },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <h1>Hola, {user.name}</h1>
      <p>
        Tu perfil público: <Link href={`/${user.username}`}>copita.ar/{user.username}</Link>
      </p>

      {!user.mpConnected ? (
        <div className="card" style={{ borderColor: "var(--coral)" }}>
          <h3>Conectá Mercado Pago para poder cobrar</h3>
          <p>Sin esto tu perfil está visible pero no puede recibir copitas.</p>
          {/* Navegación completa a propósito: dispara el flujo OAuth del servidor, no una transición de router */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/integrations/mercadopago/connect" className="btn btn-primary">
            Conectar Mercado Pago
          </a>
        </div>
      ) : (
        <div className="notice-banner">Mercado Pago conectado ✓</div>
      )}

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginTop: 24 }}>
        <div className="card">
          <p className="tag">Copitas recibidas</p>
          <h2 style={{ margin: "8px 0 0" }}>{copitaStats._count}</h2>
        </div>
        <div className="card">
          <p className="tag">Total acreditado</p>
          <h2 style={{ margin: "8px 0 0" }}>${Number(copitaStats._sum.amount ?? 0).toLocaleString("es-AR")}</h2>
        </div>
        <div className="card">
          <p className="tag">Socios del club</p>
          <h2 style={{ margin: "8px 0 0" }}>{activeSubscriptions}</h2>
        </div>
        <div className="card">
          <p className="tag">Comisión de suscripción pendiente de liquidar</p>
          <h2 style={{ margin: "8px 0 0" }}>${Number(pendingCommission._sum.amount ?? 0).toLocaleString("es-AR")}</h2>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <Link href="/panel/perfil" className="btn">
          Editar mi perfil
        </Link>
        <Link href="/panel/copitas" className="btn">
          Ver historial de copitas
        </Link>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn">
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
