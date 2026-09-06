// Job de background: sellerAccessToken() solo renueva el token de un creador
// cuando alguien intenta cobrarle una copita. Si un creador no recibe nada
// durante meses, su token puede vencer sin que nadie se entere hasta que
// falle un cobro real. Este script corre periódico (systemd timer, ver
// infra/systemd/copita-refresh-mp-tokens.*) y fuerza el mismo chequeo/renovación
// para todos los creadores conectados, antes de que haga falta cobrarles nada.
//
// Import relativo a propósito (no el alias @/) — este script se empaqueta
// aparte con esbuild (no corre dentro del server de Next), y así no depende
// de que el bundler resuelva paths de tsconfig.
import { db } from "@copita/db";
import { sellerAccessToken, needsTokenRenewal } from "../apps/web/src/lib/mercadopago";
import { logger } from "../apps/web/src/lib/logger";

// sellerAccessToken renueva solo si al token le quedan menos de
// MP_TOKEN_RENEWAL_WINDOW_DAYS días — miramos un poco más adelante para
// agarrar a todos los que van a entrar en esa ventana antes de la próxima
// corrida del job (pensado para correr 1x/día).
const LOOKAHEAD_DAYS = 20;

export async function refreshExpiringTokens(now = new Date()) {
  const threshold = new Date(now.getTime() + LOOKAHEAD_DAYS * 24 * 60 * 60_000);
  const creators = await db.user.findMany({
    where: { mpConnected: true, mpAccessToken: { not: null }, mpTokenExpiresAt: { lt: threshold } },
    select: { id: true, username: true, mpAccessToken: true, mpRefreshToken: true, mpTokenExpiresAt: true },
  });

  let refreshed = 0;
  let skipped = 0;
  let failed = 0;
  for (const creator of creators) {
    // El lookahead es más amplio que la ventana real de renovación de
    // sellerAccessToken, a propósito (ver comentario arriba). Sin este chequeo,
    // un creador agarrado por el lookahead pero que todavía no necesita
    // renovar se contaba como "refreshed" solo por no tirar error.
    if (!needsTokenRenewal(creator, now)) {
      skipped += 1;
      continue;
    }
    try {
      await sellerAccessToken(creator);
      refreshed += 1;
    } catch (error) {
      failed += 1;
      logger.error("mp_token_refresh_job.creator_failed", { creatorId: creator.id, username: creator.username, message: error instanceof Error ? error.message : String(error) });
    }
  }

  logger.info("mp_token_refresh_job.completed", { checked: creators.length, refreshed, skipped, failed });
  return { checked: creators.length, refreshed, skipped, failed };
}

// Solo corre el main() si se ejecuta directamente (no cuando un test importa refreshExpiringTokens).
if (require.main === module) {
  refreshExpiringTokens()
    .then(() => db.$disconnect())
    .catch(async (error) => {
      logger.error("mp_token_refresh_job.crashed", { message: error instanceof Error ? error.message : String(error) });
      await db.$disconnect();
      process.exit(1);
    });
}
