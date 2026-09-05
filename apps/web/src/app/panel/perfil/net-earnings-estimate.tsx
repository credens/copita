"use client";

import { roundToNiceAmount } from "@/lib/pricing";
import { MP_FEE_IMMEDIATE_EFFECTIVE_PERCENT, MP_FEE_14_DAYS_EFFECTIVE_PERCENT, estimateNetAmount } from "@/lib/mp-fee-estimate";

export function NetEarningsEstimate({ priceUsd, feeValuePercent, fxRateUsed }: { priceUsd: number; feeValuePercent: number; fxRateUsed: number }) {
  if (!(priceUsd > 0)) return null;

  const grossArs = roundToNiceAmount(priceUsd * fxRateUsed);
  const copitaFeeArs = Math.round(grossArs * (feeValuePercent / 100) * 100) / 100;
  const immediate = estimateNetAmount(grossArs, copitaFeeArs, MP_FEE_IMMEDIATE_EFFECTIVE_PERCENT);
  const in14Days = estimateNetAmount(grossArs, copitaFeeArs, MP_FEE_14_DAYS_EFFECTIVE_PERCENT);

  return (
    <div className="notice-banner" style={{ fontSize: 14 }}>
      <strong>¿Cuánto te queda neto?</strong>
      <p style={{ margin: "6px 0" }}>
        Con este precio, una copita se cobra hoy a ~${grossArs.toLocaleString("es-AR")} ARS. Copita se queda ${copitaFeeArs.toLocaleString("es-AR")}{" "}
        ({feeValuePercent}%) — el resto lo cobra directo Mercado Pago a tu cuenta, pero{" "}
        <strong>Mercado Pago también se queda su propia comisión, que Copita no ve ni controla</strong>.
      </p>
      <table className="receipt" style={{ marginTop: 8 }}>
        <tbody>
          <tr>
            <td>Acreditación inmediata (~{MP_FEE_IMMEDIATE_EFFECTIVE_PERCENT}% MP)</td>
            <td style={{ textAlign: "right" }}>~${immediate.netArs.toLocaleString("es-AR")}</td>
          </tr>
          <tr>
            <td>Acreditación a 14 días (~{MP_FEE_14_DAYS_EFFECTIVE_PERCENT}% MP)</td>
            <td style={{ textAlign: "right" }}>~${in14Days.netArs.toLocaleString("es-AR")}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: "#55504a" }}>
        Estimado con tasas publicadas de Mercado Pago Argentina a 2026 (variable según tu cuenta y forma de cobro) — no es un cálculo exacto por
        transacción. Elegís la velocidad de acreditación desde tu propia cuenta de Mercado Pago, no acá.
      </p>
    </div>
  );
}
