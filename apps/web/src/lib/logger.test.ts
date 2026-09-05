import assert from "node:assert/strict";
import test from "node:test";

test("logger.info escribe una línea JSON estructurada a console.log", async () => {
  delete process.env.ALERT_WEBHOOK_URL;
  const original = console.log;
  const lines: string[] = [];
  console.log = (line: string) => lines.push(line);
  try {
    const { logger } = (await import(`./logger.ts?case=${Math.random()}`)) as typeof import("./logger");
    logger.info("copita.created", { copitaId: "abc123" });
    assert.equal(lines.length, 1);
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.level, "info");
    assert.equal(parsed.event, "copita.created");
    assert.equal(parsed.copitaId, "abc123");
    assert.ok(parsed.time);
  } finally {
    console.log = original;
  }
});

test("logger.warn escribe a console.warn, no a console.log", async () => {
  const originalWarn = console.warn;
  const originalLog = console.log;
  const warnLines: string[] = [];
  let logCalled = false;
  console.warn = (line: string) => warnLines.push(line);
  console.log = () => {
    logCalled = true;
  };
  try {
    const { logger } = (await import(`./logger.ts?case=${Math.random()}`)) as typeof import("./logger");
    logger.warn("webhook.unknown_creator");
    assert.equal(warnLines.length, 1);
    assert.equal(logCalled, false);
    assert.equal(JSON.parse(warnLines[0]).level, "warn");
  } finally {
    console.warn = originalWarn;
    console.log = originalLog;
  }
});

test("logger.error escribe a console.error y dispara una alerta si hay webhook configurado", async () => {
  process.env.ALERT_WEBHOOK_URL = "https://hooks.example.com/test";
  const originalError = console.error;
  const originalFetch = globalThis.fetch;
  const errorLines: string[] = [];
  let alertSent = false;
  console.error = (line: string) => errorLines.push(line);
  globalThis.fetch = (async () => {
    alertSent = true;
    return new Response("ok");
  }) as typeof fetch;
  try {
    const { logger } = (await import(`./logger.ts?case=${Math.random()}`)) as typeof import("./logger");
    logger.error("webhook.reconcile_failed", { dataId: "pay-999" });
    assert.equal(errorLines.length, 1);
    assert.equal(JSON.parse(errorLines[0]).level, "error");
    // sendAlert no se espera (fire-and-forget) — darle una vuelta al microtask queue.
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(alertSent, true);
  } finally {
    console.error = originalError;
    globalThis.fetch = originalFetch;
    delete process.env.ALERT_WEBHOOK_URL;
  }
});
