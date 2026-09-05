import assert from "node:assert/strict";
import test from "node:test";

test("subscriptionAmountArs converts the monthly USD price to a rounded ARS amount", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ venta: 1234 }), { status: 200 })) as typeof fetch;
  try {
    const { subscriptionAmountArs } = await import("./pricing");
    const result = await subscriptionAmountArs(5); // 5 * 1234 = 6170 -> nearest multiple of 50
    assert.equal(result.amount, Math.max(50, Math.round((5 * 1234) / 50) * 50));
    assert.equal(result.fxRateUsed, 1234);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
