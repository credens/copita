#!/bin/sh
# Restaura un dump de backup-postgres.sh contra una base (por defecto, una
# nueva — NUNCA corras esto apuntando a la base de producción salvo que
# realmente quieras pisarla). Sirve tanto para restaurar de verdad como para
# *verificar* que un backup sirve, restaurándolo contra una base descartable.
#
# Uso: restore-postgres.sh ARCHIVO.sql.gz DATABASE_URL_DESTINO
set -eu

FILE=${1:?"Uso: restore-postgres.sh ARCHIVO.sql.gz DATABASE_URL_DESTINO"}
TARGET_URL=${2:?"Uso: restore-postgres.sh ARCHIVO.sql.gz DATABASE_URL_DESTINO"}

[ -f "$FILE" ] || { echo "No existe $FILE" >&2; exit 1; }

echo "Restaurando $FILE en $TARGET_URL ..."
gunzip -c "$FILE" | psql "$TARGET_URL"
echo "Listo. Verificá con: psql \"$TARGET_URL\" -c '\\dt'"
