# Deploy a producción (VPS)

Adaptado del esquema de [`shopy`](../../shopy): build standalone de Next.js +
[PM2](https://pm2.keymetrics.io/) + [Caddy](https://caddyserver.com/) como
reverse proxy con HTTPS automático, desplegado por `.github/workflows/deploy-production.yml`.

**Hoy no hay ningún servidor provisionado.** El workflow ya corre tests +
build en cada push a `main`, pero el paso de deploy se saltea solo (no falla)
mientras no exista el secret `PRODUCTION_HOST` — ver el mensaje
"Sin secretos de producción" en los runs de Actions.

## 1. Servidor (una sola vez)

En un VPS con Debian/Ubuntu, como root:

```bash
# Node 22, PM2, Caddy
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs caddy postgresql

# Estructura de releases (mismo esquema que shopy)
mkdir -p /root/copita/{incoming,releases,shared/bin}
npm install -g pm2
```

Crear la base y el usuario de Postgres para producción, y `/root/copita/shared/.env`
con las variables reales (ver [`.env.example`](../.env.example) en la raíz del
repo) — como mínimo `DATABASE_URL`, `MP_CLIENT_ID`, `MP_CLIENT_SECRET`,
`MP_WEBHOOK_SECRET`, `APP_URL`, `TOKEN_ENCRYPTION_KEY`, `SESSION_SECRET`,
`PLATFORM_ADMIN_EMAILS`.

Copiar el script de deploy al lugar donde lo invoca el workflow por ssh:

```bash
cp scripts/deploy-pm2-release.sh /root/copita/shared/bin/deploy-pm2-release.sh
chmod +x /root/copita/shared/bin/deploy-pm2-release.sh
```

Arrancar PM2 una vez apuntando a un primer release manual (después de eso,
todos los releases los sube el workflow):

```bash
pm2 start deploy/ecosystem.copita.cjs
pm2 save
pm2 startup   # deja PM2 arrancando solo en el boot del servidor
```

## 2. Caddy

Copiar [`infra/caddy/Caddyfile.example`](../infra/caddy/Caddyfile.example) a
`/etc/caddy/Caddyfile`, completar `{$ACME_EMAIL}` y `{$APP_DOMAIN}` (o
exportarlas como variables de entorno de Caddy), y `systemctl reload caddy`.
Apunta el DNS de `copita.ar` (y `www`) al servidor antes de esto — Caddy
necesita poder responder el challenge ACME para emitir el certificado.

## 3. Secrets de GitHub Actions

En Settings → Environments → `production` (o Secrets del repo) del repo
[`credens/copita`](https://github.com/credens/copita):

| Secret | Valor |
|---|---|
| `PRODUCTION_HOST` | IP o hostname del VPS |
| `PRODUCTION_USER` | usuario ssh (ej. `root`) |
| `PRODUCTION_SSH_PORT` | puerto ssh (ej. `22`) |
| `PRODUCTION_SSH_KEY` | clave privada ssh con acceso al servidor |
| `PRODUCTION_SSH_HOST_KEY` | salida de `ssh-keyscan -p PORT HOST` (contenido de `known_hosts`) |

Una vez cargados estos cinco secrets, el próximo push a `main` (o
`workflow_dispatch` manual desde la pestaña Actions) va a buildear, correr
toda la suite de tests, empaquetar el release standalone y desplegarlo solo.

## Cómo funciona un deploy

1. El workflow corre lint/typecheck/unit/integración/e2e/build (igual que `ci.yml`, pero acá bloquean el deploy).
2. Empaqueta `apps/web/.next/standalone` + `.next/static` + `public` + `packages/db/prisma` (schema y migraciones) en un `.tgz`.
3. Lo sube por `scp` a `/root/copita/incoming/<sha>.tgz`.
4. Por `ssh`, corre `deploy-pm2-release.sh <sha>` en el servidor, que:
   - extrae el release a `/root/copita/releases/<sha>`;
   - corre `prisma migrate deploy` contra la base real, usando el schema que trae el propio release;
   - apunta el symlink `current` al nuevo release y reinicia PM2;
   - pega contra `/api/health` hasta 40 segundos — si no responde 200, **revierte solo** al release anterior.

## Rollback manual

Si hace falta volver a un release anterior sin pasar por CI:

```bash
ssh root@<host> '/root/copita/shared/bin/rollback-release.sh <sha-anterior>'
```

(copiar antes `scripts/rollback-release.sh` a `/root/copita/shared/bin/`, igual que el de deploy).

## Lo que no está (a propósito, todavía)

Shopy además tiene backups automáticos de Postgres, un timer de health-check
externo, reglas de firewall (UFW) y envío de logs a Vector — ver
`../../shopy/infra` y `../../shopy/scripts/{backup-postgres,check-health,verify-restore}.sh`
como referencia si querés sumarlos acá más adelante. No los repliqué todavía
porque no hay servidor real donde probarlos.
