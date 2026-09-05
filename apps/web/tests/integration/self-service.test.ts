import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { integrationTestsSafe, getTestDb } from "./db-helpers";

function fakeIp() {
  return `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": fakeIp() }, body: JSON.stringify(body) });
}

test("baja de servicio (cancelación de suscripción por el aportante)", { skip: !integrationTestsSafe && "set TEST_DATABASE_URL (containing 'test') to run integration tests" }, async (t) => {
  const db = await getTestDb();
  const { encryptSecret } = await import("../../src/lib/secrets");
  const { POST: lookup } = await import("../../src/app/api/self-service/subscriptions/lookup/route");
  const { POST: cancel } = await import("../../src/app/api/self-service/subscriptions/cancel/route");

  const suffix = randomUUID().slice(0, 8);
  const supporterEmail = `socio-${suffix}@example.com`;
  const originalFetch = globalThis.fetch;

  const creator = await db.user.create({
    data: { name: "Creator Sub", email: `creatorsub-${suffix}@example.com`, passwordHash: "x", username: `creatorsub${suffix}`, mpConnected: true, mpAccessToken: encryptSecret("TEST-token"), mpTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) },
  });
  const subscription = await db.subscription.create({ data: { creatorId: creator.id, supporterEmail, amount: 5000, amountUsdRef: 5, status: "AUTHORIZED", mpPreapprovalId: `preap-${suffix}` } });

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await db.subscription.deleteMany({ where: { id: subscription.id } });
    await db.user.deleteMany({ where: { id: creator.id } });
    await db.$disconnect();
  });

  await t.test("lookup no encuentra nada con un email que no coincide", async () => {
    const response = await lookup(jsonRequest({ email: `nadie-${suffix}@example.com` }));
    const body = (await response.json()) as { subscriptions: unknown[] };
    assert.equal(body.subscriptions.length, 0);
  });

  await t.test("lookup encuentra la suscripción activa por email", async () => {
    const response = await lookup(jsonRequest({ email: supporterEmail }));
    const body = (await response.json()) as { subscriptions: Array<{ id: string; creatorUsername: string }> };
    assert.equal(body.subscriptions.length, 1);
    assert.equal(body.subscriptions[0].id, subscription.id);
    assert.equal(body.subscriptions[0].creatorUsername, creator.username);
  });

  await t.test("cancel rechaza si el email no coincide", async () => {
    const response = await cancel(jsonRequest({ subscriptionId: subscription.id, email: `otro-${suffix}@example.com` }));
    assert.equal(response.status, 404);
  });

  await t.test("cancel cancela la suscripción real en Mercado Pago y actualiza el estado", async () => {
    let putCalled = false;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/preapproval/") && init?.method === "PUT") {
        putCalled = true;
        return new Response(JSON.stringify({ status: "cancelled" }), { status: 200 });
      }
      throw new Error(`unexpected fetch to ${url}`);
    }) as typeof fetch;

    const response = await cancel(jsonRequest({ subscriptionId: subscription.id, email: supporterEmail }));
    assert.equal(response.status, 200);
    assert.equal(putCalled, true);

    const updated = await db.subscription.findUnique({ where: { id: subscription.id } });
    assert.equal(updated?.status, "CANCELLED");
    assert.ok(updated?.cancelledAt);
  });

  await t.test("cancelar de nuevo es idempotente (no vuelve a pegarle a MP)", async () => {
    globalThis.fetch = (async () => {
      throw new Error("no debería llamar a MP de nuevo");
    }) as typeof fetch;
    const response = await cancel(jsonRequest({ subscriptionId: subscription.id, email: supporterEmail }));
    assert.equal(response.status, 200);
  });
});

test("arrepentimiento (reembolso de copita por el aportante)", { skip: !integrationTestsSafe && "set TEST_DATABASE_URL (containing 'test') to run integration tests" }, async (t) => {
  const db = await getTestDb();
  const { encryptSecret } = await import("../../src/lib/secrets");
  const { POST: lookup } = await import("../../src/app/api/self-service/copitas/lookup/route");
  const { POST: refund } = await import("../../src/app/api/self-service/copitas/refund/route");

  const suffix = randomUUID().slice(0, 8);
  const senderEmail = `aportante-${suffix}@example.com`;
  const originalFetch = globalThis.fetch;

  const creator = await db.user.create({
    data: { name: "Creator Refund", email: `creatorrefund-${suffix}@example.com`, passwordHash: "x", username: `creatorrefund${suffix}`, mpConnected: true, mpAccessToken: encryptSecret("TEST-token"), mpTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) },
  });
  const withinWindow = await db.copita.create({
    data: { creatorId: creator.id, amount: 1000, amountUsdRef: 1, fxRateUsed: 1000, quantity: 1, senderEmail, idempotencyKey: randomUUID(), providerPaymentId: `pay-${suffix}-a`, status: "APPROVED" },
  });
  const commission = await db.commission.create({ data: { copitaId: withinWindow.id, rateBps: 500, baseAmount: 1000, amount: 50, status: "COLLECTED", collectedAt: new Date() } });
  const clubSubscription = await db.subscription.create({
    data: { creatorId: creator.id, supporterEmail: senderEmail, amount: 5000, amountUsdRef: 5, status: "AUTHORIZED", mpPreapprovalId: `preap-${suffix}` },
  });
  const expired = await db.copita.create({
    data: {
      creatorId: creator.id,
      amount: 1000,
      amountUsdRef: 1,
      fxRateUsed: 1000,
      quantity: 1,
      senderEmail,
      idempotencyKey: randomUUID(),
      providerPaymentId: `pay-${suffix}-b`,
      status: "APPROVED",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60_000),
    },
  });

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await db.commission.deleteMany({ where: { copitaId: { in: [withinWindow.id, expired.id] } } });
    await db.copita.deleteMany({ where: { id: { in: [withinWindow.id, expired.id] } } });
    await db.subscription.deleteMany({ where: { id: clubSubscription.id } });
    await db.user.deleteMany({ where: { id: creator.id } });
    await db.$disconnect();
  });

  await t.test("lookup marca cuál copita sigue dentro de la ventana legal y cuál no", async () => {
    const response = await lookup(jsonRequest({ email: senderEmail }));
    const body = (await response.json()) as { copitas: Array<{ id: string; withinWindow: boolean }> };
    const map = Object.fromEntries(body.copitas.map((c) => [c.id, c.withinWindow]));
    assert.equal(map[withinWindow.id], true);
    assert.equal(map[expired.id], false);
  });

  await t.test("refund rechaza si el email no coincide", async () => {
    const response = await refund(jsonRequest({ copitaId: withinWindow.id, email: `otro-${suffix}@example.com` }));
    assert.equal(response.status, 404);
  });

  await t.test("refund rechaza una copita fuera de la ventana legal", async () => {
    const response = await refund(jsonRequest({ copitaId: expired.id, email: senderEmail }));
    assert.equal(response.status, 422);
  });

  await t.test("refund procesa el reembolso real en Mercado Pago, revierte la comisión y cancela el Club del mismo creador", async () => {
    let refundCalled = false;
    let preapprovalCancelCalled = false;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes(`/v1/payments/pay-${suffix}-a/refunds`)) {
        refundCalled = true;
        return new Response(JSON.stringify({ id: 1, status: "approved" }), { status: 201 });
      }
      if (url.includes(`/preapproval/preap-${suffix}`) && init?.method === "PUT") {
        preapprovalCancelCalled = true;
        return new Response(JSON.stringify({ status: "cancelled" }), { status: 200 });
      }
      throw new Error(`unexpected fetch to ${url}`);
    }) as typeof fetch;

    const response = await refund(jsonRequest({ copitaId: withinWindow.id, email: senderEmail }));
    assert.equal(response.status, 200);
    assert.equal(refundCalled, true);
    assert.equal(preapprovalCancelCalled, true);
    const body = (await response.json()) as { subscriptionsCancelled: number };
    assert.equal(body.subscriptionsCancelled, 1);

    const updatedCopita = await db.copita.findUnique({ where: { id: withinWindow.id } });
    assert.equal(updatedCopita?.status, "REFUNDED");
    const updatedCommission = await db.commission.findUnique({ where: { id: commission.id } });
    assert.equal(updatedCommission?.status, "REVERSED");
    assert.ok(updatedCommission?.reversedAt);

    const updatedSubscription = await db.subscription.findUnique({ where: { id: clubSubscription.id } });
    assert.equal(updatedSubscription?.status, "CANCELLED");
    assert.ok(updatedSubscription?.cancelledAt);
  });
});
