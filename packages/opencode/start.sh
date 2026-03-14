#!/bin/sh
set -eu

set -- bun run --conditions=browser ./src/index.ts serve --port "${PORT:-4096}" --hostname 0.0.0.0

if [ -n "${CORS_ORIGIN:-}" ]; then
  old=$IFS
  IFS=','
  for raw in $CORS_ORIGIN; do
    url=$(printf '%s' "$raw" | xargs)
    if [ -n "$url" ]; then
      set -- "$@" --cors "$url"
    fi
  done
  IFS=$old
fi

exec "$@"
