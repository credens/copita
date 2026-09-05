import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { integrationTestsSafe, getTestDb } from "./db-helpers";

// IP distinta por request para no compartir el balde de rate limit (tabla
// RequestLimit real en Postgres) entre casos de test ni entre corridas.
function fakeIp() {
  return `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function jsonRequest(body: unknown, ip = fakeIp()) {
  return new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(body) });
}

test("register + login + duplicate guards", { skip: !integrationTestsSafe && "set TEST_DATABASE_URL (containing 'test') to run integration tests" }, async (t) => {
  const db = await getTestDb();
  const { POST: register } = await import("../../src/app/api/auth/register/route");
  const { POST: login } = await import("../../src/app/api/auth/login/route");

  const suffix = randomUUID().slice(0, 8);
  const email = `creator-${suffix}@example.com`;
  const username = `creator${suffix}`;
  const createdUsernames = [username];

  t.after(async () => {
    await db.user.deleteMany({ where: { username: { in: createdUsernames } } });
    await db.$disconnect();
  });

  await t.test("creates a new creator account and sets a session cookie", async () => {
    const response = await register(jsonRequest({ name: "Creator Test", email, password: "password1234", username }));
    assert.equal(response.status, 200);
    const body = (await response.json()) as { ok: boolean; username: string };
    assert.equal(body.ok, true);
    assert.equal(body.username, username);
    assert.match(response.headers.get("set-cookie") ?? "", /copita_session=/);

    const stored = await db.user.findUnique({ where: { username } });
    assert.ok(stored);
    assert.equal(stored?.email, email);
    assert.notEqual(stored?.passwordHash, "password1234");
  });

  await t.test("rejects a duplicate email", async () => {
    const otherUsername = `creator${randomUUID().slice(0, 8)}`;
    createdUsernames.push(otherUsername);
    const response = await register(jsonRequest({ name: "Another Name", email, password: "password1234", username: otherUsername }));
    assert.equal(response.status, 409);
    const body = (await response.json()) as { error: string };
    assert.match(body.error, /email ya está registrado/);
  });

  await t.test("rejects a duplicate username", async () => {
    const response = await register(jsonRequest({ name: "Another Name", email: `other-${suffix}@example.com`, password: "password1234", username }));
    assert.equal(response.status, 409);
  });

  await t.test("rejects a reserved username", async () => {
    const response = await register(jsonRequest({ name: "Admin Wannabe", email: `reserved-${suffix}@example.com`, password: "password1234", username: "admin" }));
    assert.equal(response.status, 409);
  });

  await t.test("rejects a password shorter than 8 characters", async () => {
    const response = await register(jsonRequest({ name: "Short Pw", email: `shortpw-${suffix}@example.com`, password: "short", username: `short${suffix}` }));
    assert.equal(response.status, 400);
  });

  await t.test("logs in with the correct credentials", async () => {
    const response = await login(jsonRequest({ email, password: "password1234" }));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie") ?? "", /copita_session=/);
  });

  await t.test("rejects an incorrect password", async () => {
    const response = await login(jsonRequest({ email, password: "wrong-password" }));
    assert.equal(response.status, 401);
  });

  await t.test("rejects a login for a non-existent email", async () => {
    const response = await login(jsonRequest({ email: `nobody-${suffix}@example.com`, password: "password1234" }));
    assert.equal(response.status, 401);
  });
});
