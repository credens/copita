// Alerta genérica por webhook — funciona con Slack (incoming webhook) o
// Discord (webhook de canal) sin depender de un proveedor pago específico.
// Sin ALERT_WEBHOOK_URL configurado, esto es un no-op silencioso: los
// eventos igual quedan en los logs (ver logger.ts), simplemente no golpean
// a nadie en tiempo real todavía.
export async function sendAlert(event: string, context: Record<string, unknown> = {}) {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;

  const summary = Object.entries(context)
    .map(([key, value]) => `${key}=${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" ");
  const message = `🚨 Copita: ${event}${summary ? `\n${summary}` : ""}`;
  const body = url.includes("discord.com") ? { content: message } : { text: message };

  try {
    await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    // Una alerta que no sale no puede tumbar el flujo real (webhook de MP,
    // checkout, etc.) — ya quedó en los logs, que es lo que importa de verdad.
  }
}
