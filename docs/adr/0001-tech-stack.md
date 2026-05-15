# ADR-0001: Tech Stack

**Status**: accepted
**Date**: 2026-05-15

## Context

Fullstack monorepo template cho SDD (Spec-Driven Development). Mục tiêu: production-ready, solo-dev friendly, boring tech over bleeding edge.

## Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React 19 + Vite 6 + TypeScript strict | Ecosystem lớn nhất, Claude Code thuộc nằm lòng |
| Styling | Tailwind v4 (CSS-first) | Không cần tailwind.config.js, custom tokens qua @theme{} |
| State / routing | TanStack Query v5 + React Router v7 | Server state và client routing tách biệt rõ ràng |
| HTTP | Axios 1.x + interceptors | Attach Bearer, handle 401 redirect tự động |
| Backend | FastAPI 0.115 + Python 3.12 | Async-first, auto OpenAPI, type-safe |
| ORM | SQLAlchemy 2.0 async + asyncpg | Pattern: routes → services → crud (3 layer) |
| Migrations | Alembic (autogenerate) | Không bao giờ create_all() trong production |
| Auth | JWT (python-jose) + bcrypt 4.x | KHÔNG dùng passlib (broken với bcrypt 4.x + Python 3.13) |
| Database | PostgreSQL 16 | aiosqlite cho tests (in-memory, không cần Postgres) |
| Test BE | pytest-asyncio + httpx.AsyncClient | SQLite in-memory via dependency_overrides |
| Test FE | Vitest 2 + Testing Library | vitest.config.ts TÁCH khỏi vite.config.ts |
| CI | GitHub Actions | 2 jobs parallel: backend + frontend |
| Container | Docker multi-stage + nginx | node:22-alpine → nginx:1.27-alpine |

## Token storage

JWT lưu trong `sessionStorage` (KHÔNG `localStorage` — XSS attack surface).

## Exit strategies

- Docker hoá được → deploy lên bất kỳ VPS
- Swap DB: asyncpg → aiosqlite hoặc MySQL qua aiomysql
- Auth: jwt có thể thay bằng Supabase Auth sau

## What we're NOT changing without an ADR

- Python version (3.12 → 3.13 cần test bcrypt compatibility)
- SQLAlchemy major version (2.0 async API khác 1.x hoàn toàn)
- Alembic workflow (không dùng create_all() thay thế)
