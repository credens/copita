#!/bin/sh
# Backup diario de Postgres: dump + gzip + rotación local + subida opcional a
# S3. Pensado para correr en el mismo servidor que la base (por systemd timer,
# ver infra/systemd/copita-backup.{service,timer}) o a mano.
#
# Uso: backup-postgres.sh [DATABASE_URL]
#   (si no se pasa, toma $DATABASE_URL del entorno — mismo valor que usa la app)
#
# Env opcionales:
#   BACKUP_DIR             default /root/copita/backups
#   BACKUP_RETENTION_DAYS  default 14 (backups locales más viejos se borran)
#   BACKUP_S3_BUCKET       si está seteado (+ `aws` CLI disponible), sube ahí también
#   S3_ENDPOINT            para S3 compatible no-AWS (MinIO, R2, DO Spaces)
set -eu

DATABASE_URL="${1:-${DATABASE_URL:?Falta DATABASE_URL}}"
BACKUP_DIR="${BACKUP_DIR:-/root/copita/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="$BACKUP_DIR/copita-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" | gzip > "$FILE"
echo "Backup creado: $FILE ($(du -h "$FILE" | cut -f1))"

find "$BACKUP_DIR" -name 'copita-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete

if [ -n "${BACKUP_S3_BUCKET:-}" ] && command -v aws >/dev/null 2>&1; then
  if [ -n "${S3_ENDPOINT:-}" ]; then
    aws s3 cp "$FILE" "s3://$BACKUP_S3_BUCKET/postgres/$(basename "$FILE")" --endpoint-url "$S3_ENDPOINT"
  else
    aws s3 cp "$FILE" "s3://$BACKUP_S3_BUCKET/postgres/$(basename "$FILE")"
  fi
  echo "Subido a s3://$BACKUP_S3_BUCKET/postgres/$(basename "$FILE")"
fi
