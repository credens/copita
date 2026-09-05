import assert from "node:assert/strict";
import test from "node:test";
import { roundToNiceAmount } from "./pricing";

test("roundToNiceAmount rounds to the nearest multiple of 50", () => {
  assert.equal(roundToNiceAmount(1234), 1250);
  assert.equal(roundToNiceAmount(1210), 1200);
  assert.equal(roundToNiceAmount(1225), 1250);
});

test("roundToNiceAmount never returns less than the 50 ARS floor", () => {
  assert.equal(roundToNiceAmount(0), 50);
  assert.equal(roundToNiceAmount(10), 50);
  assert.equal(roundToNiceAmount(-100), 50);
});

// copitaAmountArs internally imports the real (non-query-busted) `./fx` module,
// whose in-memory rate cache is shared by every call within this process. Both
// assertions below rely on the *same* mocked rate for that reason — a
// different rate belongs in its own test file (see pricing-subscription.test.ts)
// so it gets a fresh process and an unspoiled cache.
test("copitaAmountArs converts USD to ARS and rounds using the FX rate", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ venta: 1000 }), { status: 200 })) as typeof fetch;
  try {
    const { copitaAmountArs } = await import("./pricing");
    const single = await copitaAmountArs(1, 1);
    assert.equal(single.amount, 1000);
    assert.equal(single.fxRateUsed, 1000);

    const bulk = await copitaAmountArs(1, 3); // 1 * 3 * 1000 = 3000, already a multiple of 50
    assert.equal(bulk.amount, 3000);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
