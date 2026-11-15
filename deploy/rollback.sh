#!/usr/bin/env bash
# Restore a previous website release (runs /opt/bergeerd/rollback.sh, which
# `deploy.sh menu` installs). The admin panel and API are not touched.
#
#   deploy/rollback.sh            # restore the snapshot taken by the last deploy
#   deploy/rollback.sh --list     # list snapshots
#   deploy/rollback.sh <name>     # restore a specific snapshot
set -euo pipefail

HOST=${DEPLOY_HOST:-arisan@109.122.254.194}
PORT=${DEPLOY_PORT:-22}
KEY=${DEPLOY_KEY:-$HOME/.ssh/id_ed25519}

ssh -o BatchMode=yes -i "$KEY" -p "$PORT" "$HOST" /opt/bergeerd/rollback.sh "$@"
