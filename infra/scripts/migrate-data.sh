#!/usr/bin/env bash
# Dump local Postgres → restore to RDS → run Alembic migrations.
#
# Prereqs:
#   - terraform apply through Phase 4 completed (RDS reachable from your laptop)
#   - terraform output rds_endpoint   → fed into RDS_HOST
#   - RDS master password copied from Secrets Manager → RDS_PASSWORD env
#   - Local Postgres on port 5433 (see project_dhtc_db_setup memory)
#
# Idempotent? NO — drops + recreates dhtc database on RDS. Run once.

set -euo pipefail

: "${RDS_HOST:?Need RDS_HOST=dhtcdanang-prod-pg.xxxxx.ap-southeast-1.rds.amazonaws.com}"
: "${RDS_PASSWORD:?Need RDS_PASSWORD from Secrets Manager}"

LOCAL_HOST="${LOCAL_HOST:-localhost}"
LOCAL_PORT="${LOCAL_PORT:-5433}"
LOCAL_DB="${LOCAL_DB:-dhtc}"
LOCAL_USER="${LOCAL_USER:-dhtc}"

RDS_USER="${RDS_USER:-dhtcadmin}"
RDS_DB="${RDS_DB:-dhtc}"
RDS_PORT=5432

DUMP_FILE="/tmp/dhtc-$(date +%Y%m%d-%H%M%S).sql"

echo "==> Dumping local: ${LOCAL_USER}@${LOCAL_HOST}:${LOCAL_PORT}/${LOCAL_DB}"
PGPASSWORD="${LOCAL_PASSWORD:-}" pg_dump \
    --host="${LOCAL_HOST}" \
    --port="${LOCAL_PORT}" \
    --username="${LOCAL_USER}" \
    --dbname="${LOCAL_DB}" \
    --no-owner \
    --no-acl \
    --format=plain \
    --file="${DUMP_FILE}"

echo "==> Dump written: ${DUMP_FILE} ($(wc -l <"${DUMP_FILE}") lines)"

echo "==> Restoring to RDS: ${RDS_USER}@${RDS_HOST}/${RDS_DB}"
PGPASSWORD="${RDS_PASSWORD}" psql \
    --host="${RDS_HOST}" \
    --port="${RDS_PORT}" \
    --username="${RDS_USER}" \
    --dbname="${RDS_DB}" \
    --set ON_ERROR_STOP=1 \
    --quiet \
    --file="${DUMP_FILE}"

echo "==> Running Alembic upgrade against RDS"
pushd "$(dirname "$0")/../../backend" >/dev/null
DATABASE_URL="postgresql+asyncpg://${RDS_USER}:${RDS_PASSWORD}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}" \
    uv run alembic upgrade head
popd >/dev/null

echo "==> Verifying row counts"
PGPASSWORD="${RDS_PASSWORD}" psql \
    --host="${RDS_HOST}" \
    --port="${RDS_PORT}" \
    --username="${RDS_USER}" \
    --dbname="${RDS_DB}" \
    --command="\dt+" \
    --command="SELECT 'users' AS t, count(*) FROM users UNION ALL SELECT 'orders', count(*) FROM orders UNION ALL SELECT 'products', count(*) FROM products UNION ALL SELECT 'chat_messages', count(*) FROM chat_messages;"

echo "==> Done. Keep ${DUMP_FILE} as your local restore point."
