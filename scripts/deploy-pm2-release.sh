#!/bin/sh
# Corre EN EL SERVIDOR (vía ssh desde .github/workflows/deploy-production.yml).
# Extrae el release, migra la base real, corta tráfico al nuevo proceso y
# revierte solo si el health check falla. Adaptado de shopy/scripts/deploy-pm2-release.sh
# — a diferencia de shopy, acá el propio release trae su carpeta prisma (no
# depende de un shared/db mantenido aparte).
set -eu

release_id=${1:?Uso: deploy-pm2-release.sh RELEASE_ID}
base=/root/copita
archive="$base/incoming/$release_id.tgz"
release="$base/releases/$release_id"
previous=$(readlink "$base/current" 2>/dev/null || true)

[ -f "$archive" ] || { echo "No existe $archive" >&2; exit 1; }
[ ! -e "$release" ] || { echo "El release ya existe" >&2; exit 1; }
exec 9>"$base/shared/deploy.lock"
flock -n 9 || { echo "Ya existe un despliegue en curso" >&2; exit 1; }

install -d -m 0750 "$release"
tar -xzf "$archive" -C "$release"
ln -sfn "$base/shared/.env" "$release/.env"

set -a
. "$base/shared/.env"
set +a

cd "$release"
npx --yes prisma@6.19.3 migrate deploy --schema packages/db/prisma/schema.prisma

ln -sfn "$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
pm2 restart copita-web --update-env

ready=false
for _ in $(seq 1 20); do
  if curl --fail --silent --max-time 3 http://127.0.0.1:3100/api/health >/dev/null; then
    ready=true
    break
  fi
  sleep 2
done

if [ "$ready" != true ]; then
  if [ -n "$previous" ] && [ -d "$previous" ]; then
    ln -sfn "$previous" "$base/current.next"
    mv -Tf "$base/current.next" "$base/current"
    cd "$base/current"
    pm2 restart copita-web --update-env
  fi
  echo "Health check falló; release revertido" >&2
  exit 1
fi

pm2 save
rm -f "$archive"
echo "Release $release_id activo"
