import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { encryptSecret, decryptSecret } from "./secrets";

process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("hex");

test("round-trips a value through encrypt/decrypt", () => {
  const plaintext = "TEST-a-mercado-pago-access-token";
  const encrypted = encryptSecret(plaintext);
  assert.notEqual(encrypted, plaintext);
  assert.ok(encrypted.startsWith("v1:"));
  assert.equal(decryptSecret(encrypted), plaintext);
});

test("produces a different ciphertext each time (random IV)", () => {
  const a = encryptSecret("same-value");
  const b = encryptSecret("same-value");
  assert.notEqual(a, b);
  assert.equal(decryptSecret(a), "same-value");
  assert.equal(decryptSecret(b), "same-value");
});

test("passes through plaintext values that were never encrypted (legacy/plain tokens)", () => {
  assert.equal(decryptSecret("plain-legacy-token"), "plain-legacy-token");
});

test("fails to decrypt when the ciphertext was tampered with", () => {
  const encrypted = encryptSecret("secret-value");
  const [prefix, iv, tag, payload] = encrypted.split(":");
  const tampered = [prefix, iv, tag, payload.slice(0, -2) + (payload.at(-1) === "A" ? "B" : "A") + payload.at(-2)].join(":");
  assert.throws(() => decryptSecret(tampered));
});

test("rejects a malformed TOKEN_ENCRYPTION_KEY", () => {
  const original = process.env.TOKEN_ENCRYPTION_KEY;
  process.env.TOKEN_ENCRYPTION_KEY = "too-short";
  assert.throws(() => encryptSecret("x"), /64 hexadecimal characters/);
  process.env.TOKEN_ENCRYPTION_KEY = original;
});
