import assert from "node:assert/strict";
import test from "node:test";

// Cada caso importa una instancia fresca del módulo (cache-busting por query
// string) para no compartir el cache en memoria de `usdArsRate()` entre casos.
async function freshFx() {
  return import(`./fx.ts?case=${Math.random()}`) as Promise<typeof import("./fx")>;
}

test("usdArsRate returns the official rate from the API when it responds", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ venta: 1234.5 }), { status: 200 })) as typeof fetch;
  try {
    const { usdArsRate } = await freshFx();
    assert.equal(await usdArsRate(), 1234.5);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("usdArsRate falls back to USD_ARS_FALLBACK_RATE when the API is unreachable", async () => {
  const originalFetch = globalThis.fetch;
  process.env.USD_ARS_FALLBACK_RATE = "1000";
  globalThis.fetch = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  try {
    const { usdArsRate } = await freshFx();
    assert.equal(await usdArsRate(), 1000);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("usdArsRate falls back when the API responds with a non-2xx status", async () => {
  const originalFetch = globalThis.fetch;
  process.env.USD_ARS_FALLBACK_RATE = "950";
  globalThis.fetch = (async () => new Response("", { status: 500 })) as typeof fetch;
  try {
    const { usdArsRate } = await freshFx();
    assert.equal(await usdArsRate(), 950);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("usdArsRate falls back when the API responds with an unexpected shape", async () => {
  const originalFetch = globalThis.fetch;
  process.env.USD_ARS_FALLBACK_RATE = "900";
  globalThis.fetch = (async () => new Response(JSON.stringify({ oops: true }), { status: 200 })) as typeof fetch;
  try {
    const { usdArsRate } = await freshFx();
    assert.equal(await usdArsRate(), 900);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("usdArsRate caches the rate so a second call does not refetch", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls += 1;
    return new Response(JSON.stringify({ venta: 1500 }), { status: 200 });
  }) as typeof fetch;
  try {
    const { usdArsRate } = await freshFx();
    await usdArsRate();
    await usdArsRate();
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
