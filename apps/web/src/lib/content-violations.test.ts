import assert from "node:assert/strict";
import test from "node:test";
import { FINE_USD_PER_DAY, daysElapsed, accruedFineUsd, outstandingFineUsd, computeFinePortion } from "./content-violations";

test("daysElapsed redondea hacia arriba (un día empezado cuenta entero)", () => {
  const start = new Date("2026-01-01T00:00:00Z");
  assert.equal(daysElapsed(start, new Date("2026-01-01T00:00:00Z")), 0);
  assert.equal(daysElapsed(start, new Date("2026-01-01T01:00:00Z")), 1);
  assert.equal(daysElapsed(start, new Date("2026-01-02T00:00:00Z")), 1);
  assert.equal(daysElapsed(start, new Date("2026-01-03T12:00:00Z")), 3);
});

test("daysElapsed nunca da negativo", () => {
  assert.equal(daysElapsed(new Date("2026-01-05"), new Date("2026-01-01")), 0);
});

test("accruedFineUsd cobra 10 USD por día activo, sin resolver todavía", () => {
  const violation = { detectedAt: new Date("2026-01-01T00:00:00Z"), resolvedAt: null };
  assert.equal(accruedFineUsd(violation, new Date("2026-01-01T00:00:00Z")), 0);
  assert.equal(accruedFineUsd(violation, new Date("2026-01-04T00:00:00Z")), 3 * FINE_USD_PER_DAY);
});

test("accruedFineUsd deja de crecer una vez resuelta la violación", () => {
  const violation = { detectedAt: new Date("2026-01-01T00:00:00Z"), resolvedAt: new Date("2026-01-03T00:00:00Z") };
  // Ya resuelta el día 3: no importa que "now" sea mucho después.
  assert.equal(accruedFineUsd(violation, new Date("2026-06-01T00:00:00Z")), 2 * FINE_USD_PER_DAY);
});

test("outstandingFineUsd descuenta lo ya cobrado", () => {
  const violation = { detectedAt: new Date("2026-01-01T00:00:00Z"), resolvedAt: null, collectedUsd: 15 };
  const now = new Date("2026-01-04T00:00:00Z"); // 3 días -> 30 USD devengados
  assert.equal(outstandingFineUsd(violation, now), 15);
});

test("outstandingFineUsd nunca es negativo aunque se haya cobrado de más", () => {
  const violation = { detectedAt: new Date("2026-01-01T00:00:00Z"), resolvedAt: new Date("2026-01-02T00:00:00Z"), collectedUsd: 999 };
  assert.equal(outstandingFineUsd(violation, new Date("2026-06-01T00:00:00Z")), 0);
});

test("computeFinePortion no suma nada si no hay deuda pendiente", () => {
  assert.deepEqual(computeFinePortion({ outstandingUsd: 0, amountArs: 1000, normalFeeArs: 50, fxRateUsed: 1000 }), { finePortionArs: 0, finePortionUsd: 0 });
});

test("computeFinePortion cobra la deuda completa si el monto de la copita alcanza", () => {
  // Deuda de 10 USD a 1000 ARS/USD = 10000 ARS, la copita es de 20000 ARS con comisión normal de 1000.
  const result = computeFinePortion({ outstandingUsd: 10, amountArs: 20000, normalFeeArs: 1000, fxRateUsed: 1000 });
  assert.equal(result.finePortionArs, 10000);
  assert.equal(result.finePortionUsd, 10);
});

test("computeFinePortion topea al 90% del remanente, dejando algo para el creador", () => {
  // Deuda de 100 USD (100000 ARS) pero la copita es de solo 2000 ARS con comisión normal de 100:
  // el remanente es 1900, como mucho se toma el 90% (1710) y el resto de la deuda queda para la próxima copita.
  const result = computeFinePortion({ outstandingUsd: 100, amountArs: 2000, normalFeeArs: 100, fxRateUsed: 1000 });
  assert.equal(result.finePortionArs, 1710);
  assert.equal(result.finePortionUsd, 1.71);
});
