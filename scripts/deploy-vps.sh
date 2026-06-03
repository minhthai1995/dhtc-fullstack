#!/usr/bin/env bash
# deploy-vps.sh — rsync backend + start DHTC on VPS
# Usage: ./scripts/deploy-vps.sh <VPS_HOST> [--rebuild]
# Example: ./scripts/deploy-vps.sh root@103.161.97.176
set -euo pipefail

VPS="${1:-root@103.161.97.176}"
REMOTE_DIR="/opt/dhtc"
REBUILD="${2:-}"

echo "🚀 Deploying DHTC backend to $VPS:$REMOTE_DIR"

# ── 1. rsync code ─────────────────────────────────────────────
echo "📦 Syncing backend code..."
rsync -avz --delete \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude '.pytest_cache' \
  --exclude '.mypy_cache' \
  --exclude '.ruff_cache' \
  --exclude 'uploads/' \
  --exclude '.env' \
  backend/ "$VPS:$REMOTE_DIR/backend/"

# rsync docker-compose config
rsync -avz docker-compose.vps.yml "$VPS:$REMOTE_DIR/docker-compose.yml"

# ── 2. remote commands ────────────────────────────────────────
echo "🔧 Running remote setup..."
ssh "$VPS" bash << 'REMOTE'
set -euo pipefail
cd /opt/dhtc

# Check .env exists
if [ ! -f .env ]; then
  echo "❌ ERROR: /opt/dhtc/.env not found. Copy .env.production.example and fill in secrets."
  exit 1
fi

echo "✅ .env found"

# Pull & build
BUILD_FLAG=""
if [ "${REBUILD:-}" = "--rebuild" ]; then
  BUILD_FLAG="--no-cache"
fi

docker compose build $BUILD_FLAG api
docker compose up -d

echo "⏳ Waiting for API to be healthy..."
for i in {1..20}; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' dhtc_api 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "✅ API healthy"
    break
  fi
  echo "  [$i/20] Status: $STATUS — waiting 5s..."
  sleep 5
done

# Run migrations
echo "🗄️  Running Alembic migrations..."
docker exec dhtc_api sh -c "alembic upgrade head"
echo "✅ Migrations done"

echo ""
echo "🎉 Deploy complete!"
echo "   Health: curl http://localhost:8020/api/v1/health"
REMOTE

echo ""
echo "✅ DHTC API deployed at $VPS:8020"
echo "   Next: add nginx block for api.dhtcdanang.com (see scripts/add-nginx-dhtc.sh)"
