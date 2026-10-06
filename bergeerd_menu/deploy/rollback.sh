#!/usr/bin/env bash
# Restore the previous production release (runs /opt/bergeerd/rollback.sh).
#
#   ./deploy/rollback.sh            # restore the snapshot taken by the last deploy
#   ./deploy/rollback.sh --list     # list snapshots
#   ./deploy/rollback.sh <name>     # restore a specific snapshot
set -euo pipefail

HOST=${DEPLOY_HOST:-root@5.57.39.207}
PORT=${DEPLOY_PORT:-3939}
KEY=${DEPLOY_KEY:-$HOME/.ssh/id_ed25519_iran}

ssh -o BatchMode=yes -i "$KEY" -p "$PORT" "$HOST" /opt/bergeerd/rollback.sh "$@"
