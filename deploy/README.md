# Deploy a producción

Dos formas de correr esto en un servidor — elegí una, no hace falta usar las dos:

- **Opción A — PM2 + Caddy en un VPS**, adaptado del esquema de [`shopy`](../../shopy), desplegado automáticamente por `.github/workflows/deploy-production.yml`. Más control, más pasos manuales de setup.
- **Opción B — Docker / docker-compose**, con Postgres corriendo en el mismo compose. Menos pasos de setup, deploy manual (`docker compose up -d --build` después de un `git pull`) — no está conectado al workflow de GitHub Actions todavía.

Las dos comparten el mismo `Dockerfile`/`next.config.mjs` (`output: "standalone"`) y los mismos scripts de backup (`scripts/backup-postgres.sh`).

**Hoy no hay ningún servidor provisionado.** El workflow de la Opción A ya
corre tests + build en cada push a `main`, pero el paso de deploy se saltea
solo (no falla) mientras no exista el secret `PRODUCTION_HOST` — ver el
mensaje "Sin secretos de producción" en los runs de Actions.

## Opción A: PM2 + Caddy en un VPS

### 1. Servidor (una sola vez)

En un VPS con Debian/Ubuntu, como root:

```bash
# Node 22, PM2, Caddy
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs caddy postgresql postgresql-client

# Estructura de releases (mismo esquema que shopy)
mkdir -p /root/copita/{incoming,releases,shared/bin,backups}
npm install -g pm2
```

Crear la base y el usuario de Postgres para producción, y `/root/copita/shared/.env`
con las variables reales (ver [`.env.example`](../.env.example) en la raíz del
repo) — como mínimo `DATABASE_URL`, `MP_CLIENT_ID`, `MP_CLIENT_SECRET`,
`MP_WEBHOOK_SECRET`, `APP_URL`, `TOKEN_ENCRYPTION_KEY`, `SESSION_SECRET`,
`PLATFORM_ADMIN_EMAILS`.

Copiar los scripts al lugar donde los invocan el workflow de deploy y el timer de backup:

```bash
cp scripts/deploy-pm2-release.sh scripts/rollback-release.sh scripts/backup-postgres.sh /root/copita/shared/bin/
chmod +x /root/copita/shared/bin/*.sh
```

Arrancar PM2 una vez apuntando a un primer release manual (después de eso,
todos los releases los sube el workflow):

```bash
pm2 start deploy/ecosystem.copita.cjs
pm2 save
pm2 startup   # deja PM2 arrancando solo en el boot del servidor
```

### 2. Caddy

Copiar [`infra/caddy/Caddyfile.example`](../infra/caddy/Caddyfile.example) a
`/etc/caddy/Caddyfile`, completar `{$ACME_EMAIL}` y `{$APP_DOMAIN}` (o
exportarlas como variables de entorno de Caddy), y `systemctl reload caddy`.
Apunta el DNS de `copita.ar` (y `www`) al servidor antes de esto — Caddy
necesita poder responder el challenge ACME para emitir el certificado.

### 3. Secrets de GitHub Actions

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

### Cómo funciona un deploy

1. El workflow corre lint/typecheck/unit/integración/e2e/build (igual que `ci.yml`, pero acá bloquean el deploy).
2. Empaqueta `apps/web/.next/standalone` + `.next/static` + `public` + `packages/db/prisma` (schema y migraciones) en un `.tgz`.
3. Lo sube por `scp` a `/root/copita/incoming/<sha>.tgz`.
4. Por `ssh`, corre `deploy-pm2-release.sh <sha>` en el servidor, que:
   - extrae el release a `/root/copita/releases/<sha>`;
   - corre `prisma migrate deploy` contra la base real, usando el schema que trae el propio release;
   - apunta el symlink `current` al nuevo release y reinicia PM2;
   - pega contra `/api/health` hasta 40 segundos — si no responde 200, **revierte solo** al release anterior.

### Rollback manual

Si hace falta volver a un release anterior sin pasar por CI:

```bash
ssh root@<host> '/root/copita/shared/bin/rollback-release.sh <sha-anterior>'
```

## Opción B: Docker / docker-compose

Para un servidor chico o para probar el stack completo (app + Postgres) sin instalar nada más que Docker:

```bash
cp .env.example .env   # completar MP_CLIENT_ID, MP_CLIENT_SECRET, etc.
docker compose up -d --build
```

Esto levanta Postgres (con un volumen persistente `copita_postgres_data`) y la
app, migra la base sola al arrancar (`CMD` del `Dockerfile`) y queda escuchando
en `:3000`. Para HTTPS, poner Caddy (u otro reverse proxy) por delante — ver
`infra/caddy/Caddyfile.example`, apuntando `reverse_proxy` a `127.0.0.1:3000`.

Para actualizar a una versión nueva: `git pull && docker compose up -d --build`.

`docker compose logs -f app` para ver los logs estructurados de `src/lib/logger.ts`.

Backups acá: correr `scripts/backup-postgres.sh` con `DATABASE_URL="postgresql://copita:<POSTGRES_PASSWORD>@localhost:5432/copita"` (el puerto 5432 del compose está expuesto solo en `127.0.0.1`) — mismo script, mismo timer que la Opción A.

## Backups de Postgres

`scripts/backup-postgres.sh` hace `pg_dump` + gzip a `$BACKUP_DIR` (default
`/root/copita/backups`), rota lo que tenga más de `BACKUP_RETENTION_DAYS` días
(default 14) y, si hay `BACKUP_S3_BUCKET` configurado y la `aws` CLI instalada,
sube una copia a S3 (funciona con cualquier endpoint S3-compatible vía
`S3_ENDPOINT`, no hace falta que sea AWS).

Programarlo con systemd timer (Opción A o cualquier VPS con Postgres):

```bash
cp infra/systemd/copita-backup.service infra/systemd/copita-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now copita-backup.timer
```

Corre todos los días a las 04:30 UTC (con hasta 15 min de jitter). Para
probarlo antes de esperar al horario: `systemctl start copita-backup.service`.

**Verificar que un backup sirve de verdad** (no solo que el archivo exista) —
restaurarlo contra una base descartable, nunca contra la de producción:

```bash
createdb copita_verify
scripts/restore-postgres.sh /root/copita/backups/copita-<fecha>.sql.gz \
  "postgresql://localhost:5432/copita_verify"
psql "postgresql://localhost:5432/copita_verify" -c 'select count(*) from "User";'
dropdb copita_verify
```

## Lo que no está (a propósito, todavía)

Shopy además tiene un timer de health-check externo, reglas de firewall (UFW)
y envío de logs a Vector — ver `../../shopy/infra` y
`../../shopy/scripts/check-health.sh` como referencia si querés sumarlos acá
más adelante. No los repliqué todavía porque no hay servidor real donde
probarlos.
