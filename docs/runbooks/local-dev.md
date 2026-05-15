# Runbook: Local Development

## Prerequisites

- Docker Desktop (cho Postgres)
- Python 3.12+ với uv
- Node.js 22+
- Git

## 1. Backend setup

```bash
cd backend
uv sync --all-groups
cp .env.example .env
# Edit .env: DATABASE_URL, SECRET_KEY

# Khởi động Postgres (cần Docker)
docker compose up postgres -d

# Chạy migrations
uv run alembic upgrade head

# Dev server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000/api/docs
```

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:8000

npm run dev
# → http://localhost:5173
```

## 3. Full stack (Docker)

```bash
# Từ root
docker compose up --build

# Chạy migrations sau khi api container ready
docker compose exec api alembic upgrade head

# Smoke test
curl http://localhost:8000/api/v1/health
open http://localhost:3000
```

## 4. Tests

```bash
# Backend (không cần Postgres — dùng SQLite in-memory)
cd backend && uv run pytest -q

# Frontend
cd frontend && npm test
```

## 5. Rollback migration

```bash
cd backend
uv run alembic downgrade -1   # rollback 1 bước
uv run alembic history         # xem lịch sử
```

## 6. Tạo user đầu tiên (development)

```bash
# Sau khi backend đang chạy
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"changeme123"}'
```
