import assert from "node:assert/strict";
import test from "node:test";
import { MP_FEE_IMMEDIATE_EFFECTIVE_PERCENT, MP_FEE_14_DAYS_EFFECTIVE_PERCENT, estimateNetAmount } from "./mp-fee-estimate";

test("los porcentajes efectivos incluyen el 21% de IVA sobre la tasa publicada", () => {
  assert.equal(MP_FEE_IMMEDIATE_EFFECTIVE_PERCENT, 7.73); // 6.39 * 1.21
  assert.equal(MP_FEE_14_DAYS_EFFECTIVE_PERCENT, 4.22); // 3.49 * 1.21, redondeado
});

test("estimateNetAmount descuenta la comisión de Copita y la de Mercado Pago", () => {
  // $1000 ARS, comisión Copita $50 (5%), MP acreditación inmediata ~7.73%.
  const result = estimateNetAmount(1000, 50, MP_FEE_IMMEDIATE_EFFECTIVE_PERCENT);
  assert.equal(result.mpFeeArs, 77.3);
  assert.equal(result.netArs, 872.7); // 1000 - 50 - 77.3
});

test("estimateNetAmount nunca da un neto negativo", () => {
  const result = estimateNetAmount(10, 9, 50);
  assert.equal(result.netArs, 0);
});
