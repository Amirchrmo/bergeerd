#!/usr/bin/env bash
# Deploy bergeerd to production (/opt/bergeerd on the Arisan-Srv server).
#
#   deploy/deploy.sh api     # build the Go binary, upload it, restart bergeerd-api
#   deploy/deploy.sh admin   # build the admin panel, upload it to web/admin/
#   deploy/deploy.sh menu    # build the website, snapshot the live one, upload it
#
# When API and frontend changes ship together, deploy the API first: it keeps
# serving the previous admin panel and website (GET /api/menu, and admin
# requests without branch_id, target the default branch).
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
HOST=${DEPLOY_HOST:-arisan@109.122.254.194}
PORT=${DEPLOY_PORT:-22}
KEY=${DEPLOY_KEY:-$HOME/.ssh/id_ed25519}
REMOTE=/opt/bergeerd
SITE=https://bergeerd.ir
SSH=(ssh -o BatchMode=yes -i "$KEY" -p "$PORT" "$HOST")
RSH="ssh -o BatchMode=yes -i $KEY -p $PORT"

# Short commit of the deployed folder, marked -dirty if it has local changes.
version() {
  echo "$(git rev-parse --short HEAD)$(git diff --quiet HEAD -- . || echo "-dirty")"
}

http_code() { curl -s -o /dev/null -w '%{http_code}' "$1"; }

deploy_api() {
  cd "$ROOT/bergeerd_api"
  local tmp
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' RETURN
  # The server cannot fetch Go modules, so the binary is built here and the
  # server only wraps it in a small runtime image (Dockerfile.deploy).
  CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o "$tmp/bergeerd-api" ./cmd/api
  cp Dockerfile.deploy "$tmp/Dockerfile"

  echo "deploy api: uploading $(version) (previous binary kept as bergeerd-api.prev)"
  "${SSH[@]}" "cd $REMOTE/api && { [ ! -f bergeerd-api ] || cp bergeerd-api bergeerd-api.prev; }"
  rsync -az -e "$RSH" "$tmp/bergeerd-api" "$tmp/Dockerfile" "$HOST:$REMOTE/api/"
  "${SSH[@]}" "cd $REMOTE && docker compose up -d --build api"

  local code=000
  for _ in $(seq 1 30); do
    code=$(http_code "$SITE/health")
    [[ "$code" == 200 ]] && break
    sleep 2
  done
  echo "deploy api: $SITE/health -> HTTP $code"
  [[ "$code" == 200 ]] || { echo "deploy api: check 'docker logs bergeerd-api' on the server" >&2; exit 1; }
}

deploy_admin() {
  cd "$ROOT/bergeerd_admin"
  # Same origin as the site, so no CORS and both bergeerd.ir and www work.
  VITE_API_URL=/api VITE_SITE_URL= npm run build:prod
  echo "deploy admin: uploading $(version)"
  rsync -az --delete -e "$RSH" dist/ "$HOST:$REMOTE/web/admin/"
  echo "deploy admin: $SITE/admin/ -> HTTP $(http_code "$SITE/admin/")"
}

deploy_menu() {
  cd "$ROOT/bergeerd_menu"
  VITE_API_URL=/api npm run build
  local stamp ver
  stamp=$(date +%Y%m%d-%H%M%S)
  ver=$(version)
  echo "$ver" > dist/version.txt

  echo "deploy menu: installing rollback script and snapshotting the live site ($stamp)"
  rsync -e "$RSH" "$ROOT/deploy/server-rollback.sh" "$HOST:$REMOTE/rollback.sh"
  "${SSH[@]}" "chmod +x $REMOTE/rollback.sh && mkdir -p $REMOTE/releases \
    && rsync -a --exclude '/admin/' $REMOTE/web/ $REMOTE/releases/$stamp/ \
    && ls -1d $REMOTE/releases/* | sort | head -n -10 | xargs -r rm -rf"

  echo "deploy menu: uploading $ver"
  rsync -az --delete --exclude '/admin/' -e "$RSH" dist/ "$HOST:$REMOTE/web/"

  local code live
  code=$(http_code "$SITE/")
  live=$(curl -s "$SITE/version.txt")
  echo "deploy menu: $SITE -> HTTP $code, version $live"
  if [[ "$code" != "200" || "$live" != "$ver" ]]; then
    echo "deploy menu: verification failed; roll back with deploy/rollback.sh" >&2
    exit 1
  fi
}

case "${1:-}" in
  api) deploy_api ;;
  admin) deploy_admin ;;
  menu) deploy_menu ;;
  *)
    echo "usage: $0 api|admin|menu" >&2
    exit 2
    ;;
esac
