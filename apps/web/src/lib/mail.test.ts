import assert from "node:assert/strict";
import test from "node:test";

test("sendNewCopitaNotification sin SMTP configurado loguea en vez de mandar, y no lanza", async () => {
  const { sendNewCopitaNotification } = await import(`./mail?case=${Math.random()}`);
  const capturedLogs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => capturedLogs.push(args.join(" "));

  try {
    const result = await sendNewCopitaNotification({
      to: "creador@example.com",
      creatorName: "Creador Test",
      senderName: "Ana",
      message: "¡Gracias por todo!",
      amount: 1500,
      currency: "ARS",
      panelUrl: "http://localhost:3000/panel/copitas",
    });
    assert.deepEqual(result, { sent: false, reason: "SMTP no configurado" });
    const logLine = capturedLogs.find((line) => line.includes("Recibiste una copita"));
    assert.ok(logLine, "esperaba que se loguee el asunto del mail");
    assert.ok(logLine!.includes("creador@example.com"));
    assert.equal(logLine!.split("\n")[1].trim(), "http://localhost:3000/panel/copitas");
  } finally {
    console.log = originalLog;
  }
});

test("sendNewCopitaNotification usa 'Alguien' cuando no hay nombre del que manda", async () => {
  const { sendNewCopitaNotification } = await import(`./mail?case=${Math.random()}`);
  const capturedLogs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => capturedLogs.push(args.join(" "));

  try {
    await sendNewCopitaNotification({
      to: "creador@example.com",
      creatorName: "Creador Test",
      senderName: null,
      message: null,
      amount: 1000,
      currency: "ARS",
      panelUrl: "http://localhost:3000/panel/copitas",
    });
    const logLine = capturedLogs.find((line) => line.includes("Recibiste una copita"));
    assert.ok(logLine?.includes("de Alguien"));
  } finally {
    console.log = originalLog;
  }
});
