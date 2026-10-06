#!/usr/bin/env bash
# Restore a previous website release on the production server.
#
# Installed at /opt/bergeerd/rollback.sh by deploy.sh. Snapshots live in
# /opt/bergeerd/releases/<timestamp>/ and are taken right before each deploy.
#
#   /opt/bergeerd/rollback.sh            # restore the most recent snapshot
#   /opt/bergeerd/rollback.sh --list     # list snapshots
#   /opt/bergeerd/rollback.sh <name>     # restore a specific snapshot
#
# Files are synced *into* web/ (it is bind-mounted into bergeerd-nginx, so the
# directory itself must not be replaced). web/admin/ is never touched.
set -euo pipefail

BASE=/opt/bergeerd
WEB=$BASE/web
RELEASES=$BASE/releases

if [[ "${1:-}" == "--list" ]]; then
  ls -1 "$RELEASES" | sort -r
  exit 0
fi

target=${1:-$(ls -1 "$RELEASES" | sort | tail -n 1)}
src=$RELEASES/$target
if [[ -z "$target" || ! -f "$src/index.html" ]]; then
  echo "rollback: no usable snapshot '${target}' in $RELEASES" >&2
  exit 1
fi

echo "rollback: restoring $src -> $WEB"
rsync -a --delete --exclude '/admin/' "$src/" "$WEB/"

code=$(docker exec bergeerd-nginx wget -q -S -O /dev/null http://localhost/ 2>&1 | awk '/HTTP\//{print $2; exit}')
echo "rollback: done; bergeerd-nginx / -> HTTP ${code:-?}"
[[ "$code" == "200" ]]
