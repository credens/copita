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

test("registro dispara un email de verificación y el link lo confirma", { skip: !integrationTestsSafe && "set TEST_DATABASE_URL (containing 'test') to run integration tests" }, async (t) => {
  const db = await getTestDb();
  const { POST: register } = await import("../../src/app/api/auth/register/route");
  const { GET: verifyEmail } = await import("../../src/app/api/auth/verify-email/route");

  const suffix = randomUUID().slice(0, 8);
  const email = `verify-${suffix}@example.com`;
  const username = `verify${suffix}`;
  const capturedLogs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => capturedLogs.push(args.join(" "));

  t.after(async () => {
    console.log = originalLog;
    await db.authToken.deleteMany({ where: { user: { username } } });
    await db.user.deleteMany({ where: { username } });
    await db.$disconnect();
  });

  await register(jsonRequest({ name: "Verify Test", email, password: "password1234", username }));

  // Sin SMTP configurado, mail.ts loguea el link a consola en vez de enviarlo.
  const logLine = capturedLogs.find((line) => line.includes("verify-email"));
  assert.ok(logLine, "esperaba que se loguee el link de verificación");
  const token = new URL(logLine!.split("\n")[1].trim()).searchParams.get("token");
  assert.ok(token);

  const before = await db.user.findUnique({ where: { username } });
  assert.equal(before?.emailVerifiedAt, null);

  const response = await verifyEmail(new Request(`http://localhost/api/auth/verify-email?token=${token}`));
  assert.equal(response.status, 307); // redirect
  assert.match(response.headers.get("location") ?? "", /\/panel\?email=verified/);

  const after = await db.user.findUnique({ where: { username } });
  assert.ok(after?.emailVerifiedAt);

  // El mismo token no puede reutilizarse.
  const second = await verifyEmail(new Request(`http://localhost/api/auth/verify-email?token=${token}`));
  assert.match(second.headers.get("location") ?? "", /\/login\?email=invalid/);
});

test("recuperar contraseña: pide el link, lo consume y cambia la contraseña", { skip: !integrationTestsSafe && "set TEST_DATABASE_URL (containing 'test') to run integration tests" }, async (t) => {
  const db = await getTestDb();
  const { hashPassword, verifyPassword } = await import("../../src/lib/password");
  const { POST: forgotPassword } = await import("../../src/app/api/auth/forgot-password/route");
  const { POST: resetPassword } = await import("../../src/app/api/auth/reset-password/route");

  const suffix = randomUUID().slice(0, 8);
  const username = `forgot${suffix}`;
  const email = `forgot-${suffix}@example.com`;
  const capturedLogs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => capturedLogs.push(args.join(" "));

  const user = await db.user.create({ data: { name: "Forgot Test", email, passwordHash: await hashPassword("original-password"), username } });

  t.after(async () => {
    console.log = originalLog;
    await db.authToken.deleteMany({ where: { userId: user.id } });
    await db.user.deleteMany({ where: { id: user.id } });
    await db.$disconnect();
  });

  await t.test("no revela si el email existe (siempre responde ok)", async () => {
    const response = await forgotPassword(jsonRequest({ email: `nadie-${suffix}@example.com` }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
  });

  await t.test("pide el reset, consume el token y cambia la contraseña real", async () => {
    const response = await forgotPassword(jsonRequest({ email }));
    assert.equal(response.status, 200);

    const logLine = capturedLogs.find((line) => line.includes("restablecer-contrasena"));
    assert.ok(logLine, "esperaba que se loguee el link de reset");
    const token = new URL(logLine!.split("\n")[1].trim()).searchParams.get("token");
    assert.ok(token);

    const resetResponse = await resetPassword(jsonRequest({ token, password: "una-contraseña-nueva" }));
    assert.equal(resetResponse.status, 200);

    const updated = await db.user.findUnique({ where: { id: user.id } });
    assert.equal(await verifyPassword("una-contraseña-nueva", updated!.passwordHash), true);
    assert.equal(await verifyPassword("original-password", updated!.passwordHash), false);

    // El token ya usado no sirve de nuevo.
    const reuse = await resetPassword(jsonRequest({ token, password: "otra-mas" }));
    assert.equal(reuse.status, 400);
  });
});
