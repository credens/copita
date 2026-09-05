import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./password";

test("verifies the correct password against its hash", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.ok(hash.startsWith("scrypt:"));
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
});

test("rejects an incorrect password", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("wrong password", hash), false);
});

test("produces a different hash each time (random salt)", async () => {
  const a = await hashPassword("same-password");
  const b = await hashPassword("same-password");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("same-password", a), true);
  assert.equal(await verifyPassword("same-password", b), true);
});

test("rejects malformed stored hashes instead of throwing", async () => {
  assert.equal(await verifyPassword("anything", "not-a-real-hash"), false);
  assert.equal(await verifyPassword("anything", "scrypt:onlysalt"), false);
});
