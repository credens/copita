#!/bin/sh
# Corre en el servidor: vuelve a un release anterior sin pasar por CI.
# Uso: rollback-release.sh RELEASE_ID   (el nombre de carpeta bajo /root/copita/releases)
set -eu
target=${1:?Uso: rollback-release.sh RELEASE_ID}
base=/root/copita
release="$base/releases/$target"
[ -d "$release" ] || { echo "Release inexistente" >&2; exit 1; }
ln -sfn "$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
cd "$base/current"
pm2 restart copita-web --update-env
curl --fail --retry 20 --retry-delay 2 --retry-connrefused http://127.0.0.1:3100/api/health
