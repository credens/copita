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

type AccessMail = { to: string; name: string; url: string };

// Sin SMTP_HOST/USER/PASSWORD configurados (todavía no hay proveedor elegido)
// esto no falla ni bloquea el flujo: loguea el link a consola para poder
// probar el registro/recuperación en dev sin depender de un mail real. En
// cuanto se carguen las variables de entorno, empieza a mandar de verdad sin
// tocar código.
async function accessMail(data: AccessMail, subject: string, title: string, action: string) {
  const mail = transport();
  if (!mail) {
    console.log(`[mail] (SMTP no configurado) ${subject} -> ${data.to}\n  ${data.url}`);
    return { sent: false, reason: "SMTP no configurado" as const };
  }
  await mail.sendMail({
    from: sender(),
    to: data.to,
    subject,
    text: `${title}\n\n${data.url}\n\nEl enlace vence pronto. Si no lo pediste vos, ignorá este mensaje.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h1>${escapeHtml(title)}</h1><p>Hola ${escapeHtml(data.name)}.</p><p><a href="${escapeHtml(data.url)}" style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none">${escapeHtml(action)}</a></p><p>El enlace vence pronto. Si no lo pediste vos, ignorá este mensaje.</p></div>`,
  });
  return { sent: true as const };
}

export const sendEmailVerification = (data: AccessMail) => accessMail(data, "Confirmá tu email en Copita", "Confirmá tu dirección de email", "Verificar email");
export const sendPasswordReset = (data: AccessMail) => accessMail(data, "Recuperá tu acceso a Copita", "Elegí una nueva contraseña", "Elegir nueva contraseña");
