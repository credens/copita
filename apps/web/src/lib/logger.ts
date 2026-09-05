import { sendAlert } from "@/lib/alerts";

type Level = "info" | "warn" | "error";

// Logging estructurado a stdout/stderr (una línea JSON por evento) — lo
// recoge cualquier capa de hosting sin nada más que configurar (journalctl,
// PM2 logs, `docker logs`, etc.). "error" además dispara una alerta si hay
// ALERT_WEBHOOK_URL configurado (ver alerts.ts) — sin eso, sigue quedando
// en los logs igual, no se pierde.
function log(level: Level, event: string, context: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...context });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  if (level === "error") void sendAlert(event, context);
}

export const logger = {
  info: (event: string, context?: Record<string, unknown>) => log("info", event, context),
  warn: (event: string, context?: Record<string, unknown>) => log("warn", event, context),
  error: (event: string, context?: Record<string, unknown>) => log("error", event, context),
};
