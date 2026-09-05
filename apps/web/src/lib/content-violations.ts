// Multa por contenido +18 no declarado: 10 copitas por día, a partir del
// valor base de referencia (1 copita = $1 USD), sin importar el
// copitaPriceUsd particular del creador — si no, alcanzaría con poner un
// precio ridículamente bajo para licuar la multa.
export const FINE_USD_PER_DAY = 10;

const DAY_MS = 24 * 60 * 60_000;

export function daysElapsed(from: Date, to: Date) {
  return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));
}

export function accruedFineUsd(violation: { detectedAt: Date; resolvedAt: Date | null }, now = new Date()) {
  return daysElapsed(violation.detectedAt, violation.resolvedAt ?? now) * FINE_USD_PER_DAY;
}

export function outstandingFineUsd(violation: { detectedAt: Date; resolvedAt: Date | null; collectedUsd: number | string }, now = new Date()) {
  return Math.max(0, accruedFineUsd(violation, now) - Number(violation.collectedUsd));
}

// Nunca se lleva más del 90% de lo que queda del monto tras la comisión
// normal: deja al creador con algo en cada copita puntual (en vez de $0, que
// además podría rebotar en Mercado Pago) y, si la deuda es mayor, se sigue
// cobrando de a poco en las próximas copitas.
const MAX_FINE_SHARE_OF_REMAINDER = 0.9;

// Cuánto de la multa pendiente se suma al marketplace_fee normal en ESTE cobro puntual.
export function computeFinePortion(params: { outstandingUsd: number; amountArs: number; normalFeeArs: number; fxRateUsed: number }) {
  if (params.outstandingUsd <= 0) return { finePortionArs: 0, finePortionUsd: 0 };
  const outstandingArs = params.outstandingUsd * params.fxRateUsed;
  const remainder = Math.max(0, params.amountArs - params.normalFeeArs);
  const maxExtra = remainder * MAX_FINE_SHARE_OF_REMAINDER;
  const finePortionArs = Math.round(Math.min(outstandingArs, maxExtra) * 100) / 100;
  const finePortionUsd = finePortionArs > 0 ? Math.round((finePortionArs / params.fxRateUsed) * 100) / 100 : 0;
  return { finePortionArs, finePortionUsd };
}
