import { db } from "@copita/db";
import { logger } from "@/lib/logger";

// PLATFORM_ADMIN_EMAILS es el único control de acceso a /admin — esto es el
// rastro de qué hizo cada admin una vez adentro. Se guarda en la base
// (para poder listarlo en /admin/auditoria) y además queda en los logs
// estructurados de siempre.
export async function logAdminAction(adminId: string, action: string, context: { targetType?: string; targetId?: string; metadata?: Record<string, unknown> } = {}) {
  await db.adminAuditLog.create({ data: { adminId, action, targetType: context.targetType, targetId: context.targetId, metadata: context.metadata as object | undefined } });
  logger.info(`admin_audit.${action}`, { adminId, ...context });
}
