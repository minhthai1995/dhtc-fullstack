#!/usr/bin/env bash
# Production deploy script — run on VPS by GitHub Actions after code sync.
# Usage: bash /opt/dhtc/scripts/deploy.sh
set -euo pipefail

DEPLOY_DIR=/opt/dhtc
COMPOSE="docker compose -f ${DEPLOY_DIR}/docker-compose.yml"

echo "[deploy] $(date '+%Y-%m-%d %H:%M:%S') — starting"
cd "$DEPLOY_DIR"

echo "[deploy] Building api image..."
$COMPOSE build api

echo "[deploy] Restarting api container..."
$COMPOSE up -d --no-deps --remove-orphans api

echo "[deploy] Waiting for api to be healthy..."
for i in $(seq 1 20); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' dhtc_api 2>/dev/null || echo "not found")
  [ "$STATUS" = "healthy" ] && break
  [ "$i" -eq 20 ] && { echo "[deploy] ERROR: container did not become healthy"; exit 1; }
  sleep 3
done

echo "[deploy] Running migrations..."
$COMPOSE exec -T api alembic upgrade head

echo "[deploy] $(date '+%Y-%m-%d %H:%M:%S') — done ✓"
