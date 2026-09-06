import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { integrationTestsSafe, getTestDb } from "./db-helpers";

test("distributedRateLimit", { skip: !integrationTestsSafe && "set TEST_DATABASE_URL (containing 'test') to run integration tests" }, async (t) => {
  const db = await getTestDb();
  const { distributedRateLimit } = await import("../../src/lib/distributed-rate-limit");

  const usedKeys: string[] = [];
  t.after(async () => {
    await db.requestLimit.deleteMany({ where: { key: { in: usedKeys } } });
    await db.$disconnect();
  });

  await t.test("permite hasta el límite y corta el siguiente intento", async () => {
    const key = `test:${randomUUID()}`;
    usedKeys.push(key);

    for (let i = 0; i < 3; i++) {
      const attempt = await distributedRateLimit(key, 3, 60_000);
      assert.equal(attempt.allowed, true, `intento ${i + 1} debería estar permitido`);
    }
    const blocked = await distributedRateLimit(key, 3, 60_000);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfter > 0);
  });

  await t.test("cada key tiene su propio contador — no se pisan entre sí", async () => {
    const keyA = `test:${randomUUID()}`;
    const keyB = `test:${randomUUID()}`;
    usedKeys.push(keyA, keyB);

    await distributedRateLimit(keyA, 1, 60_000);
    const blockedA = await distributedRateLimit(keyA, 1, 60_000);
    const allowedB = await distributedRateLimit(keyB, 1, 60_000);

    assert.equal(blockedA.allowed, false);
    assert.equal(allowedB.allowed, true);
  });

  await t.test("la ventana se reinicia sola una vez que pasó resetAt", async () => {
    const key = `test:${randomUUID()}`;
    usedKeys.push(key);

    const windowMs = 200;
    const first = await distributedRateLimit(key, 1, windowMs);
    assert.equal(first.allowed, true);
    const blocked = await distributedRateLimit(key, 1, windowMs);
    assert.equal(blocked.allowed, false);

    await new Promise((resolve) => setTimeout(resolve, windowMs + 50));

    const afterReset = await distributedRateLimit(key, 1, windowMs);
    assert.equal(afterReset.allowed, true, "debería contar como un intento nuevo una vez vencida la ventana anterior");
  });
});
