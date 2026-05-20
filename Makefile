.PHONY: help dev build test lint typecheck migrate deploy-check hooks-test

# Default target
help:
	@echo ""
	@echo "  make dev          Start full stack in dev mode (Docker)"
	@echo "  make dev-local    Start BE + FE locally (no Docker)"
	@echo "  make build        Build production images"
	@echo "  make test         Run all tests (BE + FE)"
	@echo "  make lint         Run ruff + eslint"
	@echo "  make typecheck    Run mypy + tsc"
	@echo "  make migrate      Run Alembic migrations"
	@echo "  make deploy-check Run pre-deploy checklist"
	@echo ""

dev:
	docker compose up --build

dev-down:
	docker compose down

dev-local:
	@echo "Starting Postgres..."
	docker compose up postgres -d
	@echo "Starting backend..."
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	@echo "Starting frontend..."
	cd frontend && npm run dev

build:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build

test:
	cd backend && uv run pytest -q
	cd frontend && npm test

lint:
	cd backend && uv run ruff check .
	cd frontend && npm run lint

typecheck:
	cd backend && uv run mypy app || true
	cd frontend && npm run typecheck

migrate:
	docker compose exec api uv run alembic upgrade head

migrate-local:
	cd backend && uv run alembic upgrade head

hooks-test:  ## Test git hooks manually (runs pre-commit against all staged files)
	@bash .git/hooks/pre-commit

deploy-check:
	@echo "=== Pre-deploy checklist ==="
	@cd backend && uv run pytest -q && echo "✅ BE tests pass" || echo "❌ BE tests FAIL"
	@cd frontend && npm run typecheck && echo "✅ FE typecheck pass" || echo "❌ FE typecheck FAIL"
	@cd frontend && npm run build && echo "✅ FE build pass" || echo "❌ FE build FAIL"
	@cd backend && uv run ruff check . && echo "✅ Ruff clean" || echo "❌ Ruff errors"
	@echo "=== Done — fix ❌ before deploying ==="
