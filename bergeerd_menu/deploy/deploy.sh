#!/usr/bin/env bash
# Build the menu site and deploy it to bergeerd.ir, snapshotting the live
# version first so it can be restored with rollback.sh.
#
#   ./deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

HOST=${DEPLOY_HOST:-root@5.57.39.207}
PORT=${DEPLOY_PORT:-3939}
KEY=${DEPLOY_KEY:-$HOME/.ssh/id_ed25519_iran}
SSH=(ssh -o BatchMode=yes -i "$KEY" -p "$PORT" "$HOST")
RSH="ssh -o BatchMode=yes -i $KEY -p $PORT"

# Production talks to the API through the same origin.
VITE_API_URL=/api npm run build

stamp=$(date +%Y%m%d-%H%M%S)
version=$(git rev-parse --short HEAD)$(git diff --quiet HEAD -- . || echo "-dirty")
echo "$version" > dist/version.txt

echo "deploy: installing rollback script and snapshotting live site ($stamp)"
rsync -e "$RSH" deploy/server-rollback.sh "$HOST:/opt/bergeerd/rollback.sh"
"${SSH[@]}" "chmod +x /opt/bergeerd/rollback.sh && mkdir -p /opt/bergeerd/releases \
  && rsync -a --exclude '/admin/' /opt/bergeerd/web/ /opt/bergeerd/releases/$stamp/ \
  && ls -1d /opt/bergeerd/releases/* | sort | head -n -10 | xargs -r rm -rf"

echo "deploy: uploading $version"
rsync -az --delete --exclude '/admin/' -e "$RSH" dist/ "$HOST:/opt/bergeerd/web/"

code=$(curl -s -o /dev/null -w '%{http_code}' https://bergeerd.ir/)
live=$(curl -s https://bergeerd.ir/version.txt)
echo "deploy: https://bergeerd.ir -> HTTP $code, version $live"
if [[ "$code" != "200" || "$live" != "$version" ]]; then
  echo "deploy: verification failed; roll back with ./deploy/rollback.sh" >&2
  exit 1
fi
