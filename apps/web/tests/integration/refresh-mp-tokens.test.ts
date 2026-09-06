import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { integrationTestsSafe, getTestDb } from "./db-helpers";

const DAY_MS = 24 * 60 * 60_000;

test("job de refresh proactivo de tokens de Mercado Pago", { skip: !integrationTestsSafe && "set TEST_DATABASE_URL (containing 'test') to run integration tests" }, async (t) => {
  const db = await getTestDb();
  const { encryptSecret, decryptSecret } = await import("../../src/lib/secrets");
  const { refreshExpiringTokens } = await import("../../../../scripts/refresh-mp-tokens");

  const suffix = randomUUID().slice(0, 8);
  const createdUserIds: string[] = [];
  const originalFetch = globalThis.fetch;

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await db.$disconnect();
  });

  async function makeCreator(username: string, daysUntilExpiry: number) {
    const creator = await db.user.create({
      data: {
        name: `Creator ${username}`,
        email: `${username}@example.com`,
        passwordHash: "x",
        username,
        mpConnected: true,
        mpAccessToken: encryptSecret(`TEST-old-token-${username}`),
        mpRefreshToken: encryptSecret(`TEST-refresh-token-${username}`),
        mpTokenExpiresAt: new Date(Date.now() + daysUntilExpiry * DAY_MS),
      },
    });
    createdUserIds.push(creator.id);
    return creator;
  }

  await t.test("no toca creadores cuyo token vence lejos (fuera de la ventana de anticipación)", async () => {
    const safe = await makeCreator(`safe${suffix}`, 25);
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      throw new Error(`no debería llamar a MP para este creador: ${input}`);
    }) as typeof fetch;

    const result = await refreshExpiringTokens();
    // Puede haber otros creadores de corridas previas si algo no limpió bien,
    // así que solo afirmamos que ESTE no fue tocado.
    const untouched = await db.user.findUnique({ where: { id: safe.id } });
    assert.equal(decryptSecret(untouched!.mpAccessToken!), `TEST-old-token-safe${suffix}`);
    void result;
  });

  await t.test("detecta al creador (dentro de la ventana de anticipación) pero no llama a MP si todavía falta más de 15 días", async () => {
    const nearButNotYet = await makeCreator(`nearbutnotyet${suffix}`, 18);
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    const result = await refreshExpiringTokens();
    assert.equal(called, false, "sellerAccessToken no debería pegarle a MP a más de 15 días del vencimiento");
    assert.ok(result.checked >= 1);
    void nearButNotYet;
  });

  await t.test("renueva de verdad al creador dentro de los 15 días reales de sellerAccessToken", async () => {
    const dueSoon = await makeCreator(`duesoon${suffix}`, 5);
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ access_token: "TEST-new-token", refresh_token: "TEST-new-refresh", expires_in: 15_552_000, scope: "read write" }), { status: 200 })) as typeof fetch;

    const result = await refreshExpiringTokens();
    assert.equal(result.refreshed, 1);
    assert.equal(result.failed, 0);

    const updated = await db.user.findUnique({ where: { id: dueSoon.id } });
    assert.equal(decryptSecret(updated!.mpAccessToken!), "TEST-new-token");
    assert.ok(updated!.mpTokenExpiresAt! > new Date(Date.now() + 170 * DAY_MS));
  });

  await t.test("sigue procesando al resto si uno de los refresh falla", async () => {
    const willFail = await makeCreator(`willfail${suffix}`, 3);
    const willSucceed = await makeCreator(`willsucceed${suffix}`, 3);

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = String(init?.body ?? "");
      if (body.includes(`willfail${suffix}`)) return new Response(JSON.stringify({ message: "invalid_grant" }), { status: 400 });
      return new Response(JSON.stringify({ access_token: "TEST-ok-token", expires_in: 15_552_000 }), { status: 200 });
    }) as typeof fetch;

    const result = await refreshExpiringTokens();
    assert.ok(result.failed >= 1);
    assert.ok(result.refreshed >= 1);

    const failedCreator = await db.user.findUnique({ where: { id: willFail.id } });
    assert.equal(decryptSecret(failedCreator!.mpAccessToken!), `TEST-old-token-willfail${suffix}`); // no cambió

    const okCreator = await db.user.findUnique({ where: { id: willSucceed.id } });
    assert.equal(decryptSecret(okCreator!.mpAccessToken!), "TEST-ok-token");
  });
});
