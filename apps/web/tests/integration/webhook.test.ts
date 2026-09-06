import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID, createHmac } from "node:crypto";
import { integrationTestsSafe, getTestDb } from "./db-helpers";

function signatureHeader(dataId: string, requestId: string) {
  const ts = Math.floor(Date.now() / 1000);
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", process.env.MP_WEBHOOK_SECRET!).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

test("webhook de Mercado Pago", { skip: !integrationTestsSafe && "set TEST_DATABASE_URL (containing 'test') to run integration tests" }, async (t) => {
  const db = await getTestDb();
  const { encryptSecret } = await import("../../src/lib/secrets");
  const { POST: webhook } = await import("../../src/app/api/webhooks/mercadopago/route");
  const { NextRequest } = await import("next/server");

  const suffix = randomUUID().slice(0, 8);
  const username = `webhook${suffix}`;
  const originalFetch = globalThis.fetch;
  let paymentsFetchCalls = 0;

  const creator = await db.user.create({
    data: {
      name: "Webhook Creator",
      email: `webhook-${suffix}@example.com`,
      passwordHash: "x",
      username,
      mpConnected: true,
      mpAccessToken: encryptSecret("TEST-fake-token"),
      mpTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });
  const copita = await db.copita.create({
    data: {
      creatorId: creator.id,
      amount: 1000,
      amountUsdRef: 1,
      fxRateUsed: 1000,
      quantity: 1,
      senderEmail: "aportante@example.com",
      idempotencyKey: randomUUID(),
      providerPaymentId: "pref-abc",
    },
  });
  await db.commission.create({ data: { copitaId: copita.id, rateBps: 500, baseAmount: 1000, amount: 50 } });

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await db.paymentEvent.deleteMany({ where: { copitaId: copita.id } });
    await db.commission.deleteMany({ where: { copitaId: copita.id } });
    await db.copita.deleteMany({ where: { id: copita.id } });
    await db.user.deleteMany({ where: { id: creator.id } });
    await db.$disconnect();
  });

  function postWebhook(payload: unknown, headers: Record<string, string>) {
    return webhook(
      new NextRequest(`http://localhost/api/webhooks/mercadopago?creator=${username}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(payload) }),
    );
  }

  await t.test("rejects a request with an invalid signature", async () => {
    const response = await postWebhook({ id: "evt-bad", type: "payment", action: "payment.updated", data: { id: "pay-bad" } }, { "x-signature": "ts=1,v1=deadbeef", "x-request-id": "req-1" });
    assert.equal(response.status, 401);
  });

  await t.test("approves the payment, updates the Copita and collects the commission — then ignores the duplicate", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/v1/payments/pay-999")) {
        paymentsFetchCalls += 1;
        return new Response(JSON.stringify({ id: "pay-999", status: "approved", external_reference: copita.id }), { status: 200 });
      }
      throw new Error(`unexpected fetch to ${url}`);
    }) as typeof fetch;

    const dataId = "pay-999";
    const requestId = "req-2";
    const payload = { id: "evt-approved", type: "payment", action: "payment.updated", data: { id: dataId } };

    const first = await postWebhook(payload, { "x-signature": signatureHeader(dataId, requestId), "x-request-id": requestId });
    assert.equal(first.status, 200);
    assert.equal(paymentsFetchCalls, 1);

    const updated = await db.copita.findUnique({ where: { id: copita.id }, include: { commission: true } });
    assert.equal(updated?.status, "APPROVED");
    assert.equal(updated?.providerPaymentId, "pay-999");
    assert.equal(updated?.commission?.status, "COLLECTED");
    assert.ok(updated?.commission?.collectedAt);

    // Mismo evento de nuevo (mismo provider+providerEventId+eventType): no debe volver a pegarle a la API de MP.
    const second = await postWebhook(payload, { "x-signature": signatureHeader(dataId, requestId), "x-request-id": requestId });
    assert.equal(second.status, 200);
    assert.equal(paymentsFetchCalls, 1, "el evento duplicado no debería reconciliar de nuevo");
  });

  await t.test("returns 404 when the creator cannot be resolved", async () => {
    const dataId = "pay-nowhere";
    const requestId = "req-3";
    const response = await webhook(
      new NextRequest(`http://localhost/api/webhooks/mercadopago`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-signature": signatureHeader(dataId, requestId), "x-request-id": requestId },
        body: JSON.stringify({ id: "evt-nowhere", type: "payment", data: { id: dataId } }),
      }),
    );
    assert.equal(response.status, 404);
  });

  await t.test("corta con 429 a una IP que ya agotó el rate limit del webhook, antes de validar la firma", async () => {
    const { distributedRateLimit } = await import("../../src/lib/distributed-rate-limit");
    const ip = `test-${randomUUID()}`;
    // Agota el límite real (120/min, ver route.ts) para esta IP de prueba.
    for (let i = 0; i < 120; i++) await distributedRateLimit(`webhook:mp:${ip}`, 120, 60_000);
    t.after(() => db.requestLimit.deleteMany({ where: { key: `webhook:mp:${ip}` } }));

    const response = await webhook(
      new NextRequest(`http://localhost/api/webhooks/mercadopago`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip, "x-signature": "ts=1,v1=deadbeef" },
        body: JSON.stringify({ id: "evt-flood", type: "payment", data: { id: "pay-flood" } }),
      }),
    );
    assert.equal(response.status, 429);
  });
});

test("webhook: cobro y reversión de la multa +18 sobre una copita", { skip: !integrationTestsSafe && "set TEST_DATABASE_URL (containing 'test') to run integration tests" }, async (t) => {
  const db = await getTestDb();
  const { encryptSecret } = await import("../../src/lib/secrets");
  const { POST: webhook } = await import("../../src/app/api/webhooks/mercadopago/route");
  const { NextRequest } = await import("next/server");

  const suffix = randomUUID().slice(0, 8);
  const username = `finewebhook${suffix}`;
  const originalFetch = globalThis.fetch;

  const creator = await db.user.create({
    data: {
      name: "Fine Webhook Creator",
      email: `finewebhook-${suffix}@example.com`,
      passwordHash: "x",
      username,
      mpConnected: true,
      mpAccessToken: encryptSecret("TEST-fake-token"),
      mpTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });
  const violation = await db.contentViolation.create({ data: { creatorId: creator.id, reason: "test" } });
  const copita = await db.copita.create({
    data: {
      creatorId: creator.id,
      amount: 4000,
      amountUsdRef: 4,
      fxRateUsed: 1000,
      quantity: 4,
      senderEmail: "aportante@example.com",
      idempotencyKey: randomUUID(),
      providerPaymentId: "pref-fine",
      contentViolationId: violation.id,
      finePortionArs: 3420,
      finePortionUsd: 3.42,
    },
  });
  await db.commission.create({ data: { copitaId: copita.id, rateBps: 500, baseAmount: 4000, amount: 3620 } });

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await db.paymentEvent.deleteMany({ where: { copitaId: copita.id } });
    await db.commission.deleteMany({ where: { copitaId: copita.id } });
    await db.copita.deleteMany({ where: { id: copita.id } });
    await db.contentViolation.deleteMany({ where: { id: violation.id } });
    await db.user.deleteMany({ where: { id: creator.id } });
    await db.$disconnect();
  });

  function postWebhook(payload: unknown, headers: Record<string, string>) {
    return webhook(
      new NextRequest(`http://localhost/api/webhooks/mercadopago?creator=${username}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(payload) }),
    );
  }
  function mockRemote(status: string) {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/v1/payments/pay-fine")) return new Response(JSON.stringify({ id: "pay-fine", status, external_reference: copita.id }), { status: 200 });
      throw new Error(`unexpected fetch to ${url}`);
    }) as typeof fetch;
  }

  await t.test("aprobar la copita suma finePortionUsd a collectedUsd de la multa", async () => {
    mockRemote("approved");
    const response = await postWebhook({ id: "evt-fine-approved", type: "payment", data: { id: "pay-fine" } }, { "x-signature": signatureHeader("pay-fine", "req-fine-1"), "x-request-id": "req-fine-1" });
    assert.equal(response.status, 200);

    const updatedViolation = await db.contentViolation.findUnique({ where: { id: violation.id } });
    assert.equal(Number(updatedViolation?.collectedUsd), 3.42);
  });

  await t.test("reembolsar la misma copita después revierte lo cobrado de la multa", async () => {
    mockRemote("refunded");
    const response = await postWebhook({ id: "evt-fine-refunded", type: "payment", data: { id: "pay-fine" } }, { "x-signature": signatureHeader("pay-fine", "req-fine-2"), "x-request-id": "req-fine-2" });
    assert.equal(response.status, 200);

    const updatedViolation = await db.contentViolation.findUnique({ where: { id: violation.id } });
    assert.equal(Number(updatedViolation?.collectedUsd), 0);
  });
});
