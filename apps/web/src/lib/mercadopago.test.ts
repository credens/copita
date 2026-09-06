import assert from "node:assert/strict";
import test from "node:test";
import { needsTokenRenewal, mpConnectionStatus, MP_TOKEN_RENEWAL_WINDOW_DAYS } from "./mercadopago";

const DAY_MS = 24 * 60 * 60_000;
const now = new Date("2026-01-01T00:00:00Z");

test("needsTokenRenewal es false sin fecha de vencimiento (nunca vence)", () => {
  assert.equal(needsTokenRenewal({ mpTokenExpiresAt: null }, now), false);
});

test("needsTokenRenewal es false bien lejos del vencimiento", () => {
  assert.equal(needsTokenRenewal({ mpTokenExpiresAt: new Date(now.getTime() + 25 * DAY_MS) }, now), false);
});

test("needsTokenRenewal es true justo en el borde de la ventana", () => {
  const expiresAt = new Date(now.getTime() + MP_TOKEN_RENEWAL_WINDOW_DAYS * DAY_MS);
  assert.equal(needsTokenRenewal({ mpTokenExpiresAt: expiresAt }, now), true);
});

test("needsTokenRenewal es true si ya venció", () => {
  assert.equal(needsTokenRenewal({ mpTokenExpiresAt: new Date(now.getTime() - DAY_MS) }, now), true);
});

test("mpConnectionStatus: not_connected si nunca conectó", () => {
  assert.equal(mpConnectionStatus({ mpConnected: false, mpAccessToken: null, mpTokenExpiresAt: null }, now), "not_connected");
});

test("mpConnectionStatus: not_connected si mpConnected quedó true pero sin token guardado", () => {
  assert.equal(mpConnectionStatus({ mpConnected: true, mpAccessToken: null, mpTokenExpiresAt: null }, now), "not_connected");
});

test("mpConnectionStatus: token_error tiene prioridad aunque el token todavía no haya vencido", () => {
  const status = mpConnectionStatus(
    { mpConnected: true, mpAccessToken: "x", mpTokenExpiresAt: new Date(now.getTime() + 60 * DAY_MS), mpTokenError: "invalid_grant" },
    now,
  );
  assert.equal(status, "token_error");
});

test("mpConnectionStatus: renewal_due dentro de la ventana de renovación, sin error", () => {
  const status = mpConnectionStatus({ mpConnected: true, mpAccessToken: "x", mpTokenExpiresAt: new Date(now.getTime() + 5 * DAY_MS), mpTokenError: null }, now);
  assert.equal(status, "renewal_due");
});

test("mpConnectionStatus: connected cuando está todo en orden", () => {
  const status = mpConnectionStatus({ mpConnected: true, mpAccessToken: "x", mpTokenExpiresAt: new Date(now.getTime() + 60 * DAY_MS), mpTokenError: null }, now);
  assert.equal(status, "connected");
});
