#!/bin/sh
set -e

echo "[entrypoint] Applying migrations…"
node dist/db/migrate.js

if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] Seeding (SEED_ON_START=true)…"
  node dist/db/seed/seed.js
fi

echo "[entrypoint] Starting backend…"
exec node dist/main.js
