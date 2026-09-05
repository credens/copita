import assert from "node:assert/strict";
import test from "node:test";

test("sendAlert no hace nada si no hay ALERT_WEBHOOK_URL", async () => {
  delete process.env.ALERT_WEBHOOK_URL;
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response("ok");
  }) as typeof fetch;
  try {
    const { sendAlert } = (await import(`./alerts.ts?case=${Math.random()}`)) as typeof import("./alerts");
    await sendAlert("test.event", { foo: "bar" });
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("sendAlert manda formato Slack ({text}) a una URL genérica", async () => {
  process.env.ALERT_WEBHOOK_URL = "https://hooks.slack.example.com/services/xyz";
  const originalFetch = globalThis.fetch;
  let capturedBody: unknown = null;
  let capturedUrl = "";
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedBody = JSON.parse(String(init?.body));
    return new Response("ok");
  }) as typeof fetch;
  try {
    const { sendAlert } = (await import(`./alerts.ts?case=${Math.random()}`)) as typeof import("./alerts");
    await sendAlert("webhook.reconcile_failed", { creator: "micastreams" });
    assert.equal(capturedUrl, "https://hooks.slack.example.com/services/xyz");
    assert.match((capturedBody as { text: string }).text, /webhook\.reconcile_failed/);
    assert.match((capturedBody as { text: string }).text, /creator=micastreams/);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.ALERT_WEBHOOK_URL;
  }
});

test("sendAlert manda formato Discord ({content}) cuando la URL es de discord.com", async () => {
  process.env.ALERT_WEBHOOK_URL = "https://discord.com/api/webhooks/123/abc";
  const originalFetch = globalThis.fetch;
  let capturedBody: unknown = null;
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    capturedBody = JSON.parse(String(init?.body));
    return new Response("ok");
  }) as typeof fetch;
  try {
    const { sendAlert } = (await import(`./alerts.ts?case=${Math.random()}`)) as typeof import("./alerts");
    await sendAlert("test.event");
    assert.ok("content" in (capturedBody as object));
    assert.ok(!("text" in (capturedBody as object)));
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.ALERT_WEBHOOK_URL;
  }
});

test("sendAlert no lanza si el fetch a la alerta falla", async () => {
  process.env.ALERT_WEBHOOK_URL = "https://hooks.example.com/broken";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  try {
    const { sendAlert } = (await import(`./alerts.ts?case=${Math.random()}`)) as typeof import("./alerts");
    await assert.doesNotReject(() => sendAlert("test.event"));
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.ALERT_WEBHOOK_URL;
  }
});
