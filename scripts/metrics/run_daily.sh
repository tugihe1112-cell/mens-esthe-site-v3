#!/bin/bash
set -u

PROJ="$HOME/Downloads/mens-esthe-site"
STAMP="$HOME/.mens-esthe-metrics.lastrun"
LOG="$HOME/Library/Logs/mens-esthe-metrics.log"
TODAY="$(date +%Y-%m-%d)"

exec >>"$LOG" 2>&1
echo "--- $(date '+%F %T') trigger=${1:-manual}"

if [ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$TODAY" ]; then
  echo "skip: already succeeded today"
  exit 0
fi

NODE_BIN=""
for c in /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.volta/bin/node"; do
  [ -x "$c" ] && NODE_BIN="$c" && break
done
[ -z "$NODE_BIN" ] && NODE_BIN="$(ls -d "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | tail -1)"
[ -x "${NODE_BIN:-}" ] || { echo "ERROR: node not found"; exit 1; }
echo "node: $NODE_BIN"

cd "$PROJ" || { echo "ERROR: cd failed"; exit 1; }

if "$NODE_BIN" scripts/metrics/fetch_metrics.mjs; then
  echo "$TODAY" > "$STAMP"
  echo "OK"
else
  rc=$?; echo "FAILED rc=$rc (retry at next slot)"; exit $rc
fi
