import nodemailer from "nodemailer";

function transport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port: Number(process.env.SMTP_PORT ?? 587), secure: process.env.SMTP_SECURE === "true", auth: { user, pass } });
}

function sender() {
  return { name: "Copita", address: process.env.EMAIL_FROM ?? "no-responder@copita.ar" };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

// Sin SMTP_HOST/USER/PASSWORD configurados (todavía no hay proveedor elegido)
// esto no falla ni bloquea el flujo: loguea a consola en vez de mandar un
// mail real, para poder probar estos flujos en dev sin depender de un
// proveedor. En cuanto se carguen las variables de entorno, empieza a mandar
// de verdad sin tocar código. La segunda línea del log siempre es la URL —
// los tests de integración la leen de ahí (ver password-and-verification.test.ts).
async function deliver(to: string, subject: string, url: string, text: string, html: string) {
  const mail = transport();
  if (!mail) {
    console.log(`[mail] (SMTP no configurado) ${subject} -> ${to}\n  ${url}`);
    return { sent: false, reason: "SMTP no configurado" as const };
  }
  await mail.sendMail({ from: sender(), to, subject, text, html });
  return { sent: true as const };
}

type AccessMail = { to: string; name: string; url: string };

function accessMail(data: AccessMail, subject: string, title: string, action: string) {
  const text = `${title}\n\n${data.url}\n\nEl enlace vence pronto. Si no lo pediste vos, ignorá este mensaje.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1>${escapeHtml(title)}</h1><p>Hola ${escapeHtml(data.name)}.</p><p><a href="${escapeHtml(data.url)}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none">${escapeHtml(action)}</a></p><p>El enlace vence pronto. Si no lo pediste vos, ignorá este mensaje.</p></div>`;
  return deliver(data.to, subject, data.url, text, html);
}

export const sendEmailVerification = (data: AccessMail) => accessMail(data, "Confirmá tu email en Copita", "Confirmá tu dirección de email", "Verificar email");
export const sendPasswordReset = (data: AccessMail) => accessMail(data, "Recuperá tu acceso a Copita", "Elegí una nueva contraseña", "Elegir nueva contraseña");

type NewCopitaMail = { to: string; creatorName: string; senderName?: string | null; message?: string | null; amount: number; currency: string; panelUrl: string };

export function sendNewCopitaNotification(data: NewCopitaMail) {
  const from = data.senderName?.trim() || "Alguien";
  const amountLabel = `${data.currency} ${data.amount.toLocaleString("es-AR")}`;
  const subject = `¡Recibiste una copita de ${from}!`;
  const messageLine = data.message ? `\n\nMensaje: "${data.message}"` : "";
  const text = `Hola ${data.creatorName}.\n\n${from} te invitó una copita de ${amountLabel}.${messageLine}\n\nVer el detalle: ${data.panelUrl}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1>¡Recibiste una copita! ☕</h1><p>Hola ${escapeHtml(data.creatorName)}.</p><p><strong>${escapeHtml(from)}</strong> te invitó una copita de <strong>${escapeHtml(amountLabel)}</strong>.</p>${data.message ? `<p style="font-style:italic">“${escapeHtml(data.message)}”</p>` : ""}<p><a href="${escapeHtml(data.panelUrl)}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none">Ver en mi panel</a></p></div>`;
  return deliver(data.to, subject, data.panelUrl, text, html);
}
