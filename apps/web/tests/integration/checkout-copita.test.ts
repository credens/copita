import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { integrationTestsSafe, getTestDb } from "./db-helpers";

function mockFetch(mpResponse: { status: number; body: unknown }) {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("dolarapi.com")) return new Response(JSON.stringify({ venta: 1000 }), { status: 200 });
    if (url.includes("api.mercadopago.com/checkout/preferences")) return new Response(JSON.stringify(mpResponse.body), { status: mpResponse.status });
    throw new Error(`unexpected fetch to ${url}`);
  }) as typeof fetch;
}

test("checkout de copita", { skip: !integrationTestsSafe && "set TEST_DATABASE_URL (containing 'test') to run integration tests" }, async (t) => {
  const db = await getTestDb();
  const { encryptSecret } = await import("../../src/lib/secrets");
  const { POST: checkoutCopita } = await import("../../src/app/api/checkout/copita/route");
  const { NextRequest } = await import("next/server");

  const suffix = randomUUID().slice(0, 8);
  const createdUserIds: string[] = [];
  const originalFetch = globalThis.fetch;

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await db.commission.deleteMany({ where: { copita: { creatorId: { in: createdUserIds } } } });
    await db.copita.deleteMany({ where: { creatorId: { in: createdUserIds } } });
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await db.$disconnect();
  });

  function postCheckout(body: unknown) {
    return checkoutCopita(new NextRequest("http://localhost/api/checkout/copita", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  }

  await t.test("rejects a checkout for a creator that has not connected Mercado Pago", async () => {
    const username = `nomp${suffix}`;
    const creator = await db.user.create({ data: { name: "No MP", email: `nomp-${suffix}@example.com`, passwordHash: "x", username } });
    createdUserIds.push(creator.id);

    globalThis.fetch = mockFetch({ status: 200, body: {} });
    const response = await postCheckout({ username, senderEmail: "aportante@example.com" });
    assert.equal(response.status, 503);
  });

  await t.test("creates a Copita + Commission and returns a checkout URL on success", async () => {
    const username = `connected${suffix}`;
    const creator = await db.user.create({
      data: {
        name: "Connected Creator",
        email: `connected-${suffix}@example.com`,
        passwordHash: "x",
        username,
        mpConnected: true,
        mpAccessToken: encryptSecret("TEST-fake-token"),
        mpTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        copitaPriceUsd: 1,
      },
    });
    createdUserIds.push(creator.id);

    globalThis.fetch = mockFetch({ status: 200, body: { id: "pref-123", init_point: "https://mp.example/init" } });
    const response = await postCheckout({ username, quantity: 2, senderEmail: "aportante@example.com", message: "vamos!" });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { checkoutUrl: string };
    assert.equal(body.checkoutUrl, "https://mp.example/init");

    const copita = await db.copita.findFirst({ where: { creatorId: creator.id }, include: { commission: true } });
    assert.ok(copita);
    assert.equal(Number(copita?.amount), 2000); // 2 copitas * $1 USD * 1000 ARS/USD (mocked), ya múltiplo de 50
    assert.equal(copita?.quantity, 2);
    assert.equal(copita?.message, "vamos!");
    assert.equal(copita?.providerPaymentId, "pref-123");
    assert.equal(Number(copita?.commission?.amount), 100); // 5% de 2000
    assert.equal(copita?.commission?.status, "PENDING");
  });

  await t.test("persists the Copita with the raw error response when Mercado Pago rejects the preference", async () => {
    const username = `mpfails${suffix}`;
    const creator = await db.user.create({
      data: {
        name: "Fails Creator",
        email: `mpfails-${suffix}@example.com`,
        passwordHash: "x",
        username,
        mpConnected: true,
        mpAccessToken: encryptSecret("TEST-fake-token"),
        mpTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        copitaPriceUsd: 1,
      },
    });
    createdUserIds.push(creator.id);

    globalThis.fetch = mockFetch({ status: 401, body: { message: "At least one policy returned UNAUTHORIZED." } });
    const response = await postCheckout({ username, senderEmail: "aportante@example.com" });
    assert.equal(response.status, 422);
    const body = (await response.json()) as { error: string };
    assert.match(body.error, /UNAUTHORIZED/);

    const copita = await db.copita.findFirst({ where: { creatorId: creator.id } });
    assert.ok(copita);
    assert.equal(copita?.status, "PENDING");
    assert.equal(copita?.providerPaymentId, null);
  });
});
