// Comisión de Mercado Pago sobre Checkout Pro con tarjeta en Argentina —
// Copita NO la cobra ni la controla, la retiene MP directo antes de que la
// plata le llegue al creador. Son valores de referencia (tasas publicadas a
// 2026, pueden cambiar sin que Copita se entere) para que el creador tenga
// una idea de cuánto le queda neto, no un cálculo exacto por transacción —
// MP no expone una API para consultar la tasa real antes de cobrar.
export const MP_FEE_IMMEDIATE_PERCENT = 6.39;
export const MP_FEE_14_DAYS_PERCENT = 3.49;
const IVA_PERCENT = 21;

function withIva(percent: number) {
  return Math.round(percent * (1 + IVA_PERCENT / 100) * 100) / 100;
}

export const MP_FEE_IMMEDIATE_EFFECTIVE_PERCENT = withIva(MP_FEE_IMMEDIATE_PERCENT);
export const MP_FEE_14_DAYS_EFFECTIVE_PERCENT = withIva(MP_FEE_14_DAYS_PERCENT);

export function estimateNetAmount(grossArs: number, copitaFeeArs: number, mpFeeEffectivePercent: number) {
  const mpFeeArs = Math.round(grossArs * (mpFeeEffectivePercent / 100) * 100) / 100;
  const netArs = Math.max(0, Math.round((grossArs - copitaFeeArs - mpFeeArs) * 100) / 100);
  return { mpFeeArs, netArs };
}
