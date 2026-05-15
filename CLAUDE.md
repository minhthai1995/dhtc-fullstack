# CLAUDE.md

Fullstack monorepo template: **FastAPI + SQLAlchemy 2.0 async + Alembic** (BE) · **React 19 + Vite 6 + TypeScript strict + Tailwind v4** (FE). Auth wired end-to-end: JWT login → sessionStorage → Axios interceptor → protected routes.

## Build & test

```bash
# Backend (from repo root)
cd backend
uv sync --all-groups                              # install deps
uv run uvicorn app.main:app --reload              # dev server :8000
uv run pytest -q                                  # tests (SQLite in-memory, no Postgres needed)
uv run ruff check . && uv run ruff format .
uv run mypy app

# Alembic migrations
uv run alembic revision --autogenerate -m "msg"   # always REVIEW generated file before applying
uv run alembic upgrade head                        # needs Postgres running
uv run alembic downgrade -1

# Frontend (from repo root)
cd frontend
npm install
npm run dev          # :5173  (Vite proxies /api → :8000)
npm test             # vitest — uses vitest.config.ts (separate from vite.config.ts)
npm run typecheck    # tsc --noEmit
npm run lint
npm run build

# Docker (full stack)
docker compose up --build
docker compose exec api alembic upgrade head
curl http://localhost:8000/api/v1/health
open http://localhost:3000
```

## Architecture

```
backend/app/
  api/v1/      routes: validate input → call service/crud → return schema
  services/    business logic: orchestrate crud, raise domain errors
  crud/        pure DB ops only (no if-logic, no HTTP concerns)
  models/      SQLAlchemy ORM — all models must be in models/__init__.py
  schemas/     Pydantic v2 DTOs
  core/        config · db engine · security (jwt + bcrypt)
  deps.py      current_user → Depends(get_db), NOT Depends(db_session)

frontend/src/
  features/<domain>/   <domain>.api.ts · use<Domain>.ts · page component
  components/ui/       shared primitives (Button, Card, Spinner)
  lib/                 axios.ts (interceptors) · cn.ts
  pages/               Home · Login · NotFound
  types/api.ts         shared API types
```

## Code style

### Python
- Full type annotations on every function (params + return). `mypy --strict` is CI gate.
- 3-layer rule: routes never query DB directly. crud has no business logic (`if` conditions).
- Pydantic v2: `model_config = ConfigDict(from_attributes=True)` (not `class Config`).
- Ruff line 100. Absolute imports (`from app.*`). No pylint/flake8.
- `bcrypt` directly — no passlib (broken with bcrypt 4.x on Python 3.13+).

### TypeScript
- `strict: true` enforced. No `any` without explaining comment. No `// @ts-ignore` without justification.
- Server state via TanStack Query v5 — no `useState + useEffect` for data fetching.
- Tailwind v4: no `tailwind.config.js`. Custom tokens go in `@theme {}` in `index.css`.
- Token storage: `sessionStorage` only (NOT `localStorage` — XSS attack surface).
- `cn()` helper for conditional classes. No inline styles.

### Git
- Conventional commits: `feat|fix|chore|docs|test|refactor`.
- Feature branches only. Never commit directly to `main`.

## Critical gotchas

**passlib is broken** — Use `bcrypt.hashpw` / `bcrypt.checkpw` directly. Never `from passlib.context import CryptContext`.

**`current_user` must use `Depends(get_db)`** — `Depends(db_session)` bypasses FastAPI's `dependency_overrides` in tests → 500 instead of 401.

**Login is form data, not JSON** — Frontend sends `application/x-www-form-urlencoded` (`URLSearchParams`). Backend uses `OAuth2PasswordRequestForm`.

**vitest.config.ts ≠ vite.config.ts** — Keep separate files. Merging `test` config into `vite.config.ts` causes type conflict. `npm test` uses `--config vitest.config.ts`.

**Alembic autogenerate misses**: enum value changes, `server_default`, CHECK constraints — always read generated migration before `upgrade head`.

**Async SQLAlchemy**: no lazy loading. Relationship access outside async context raises `MissingGreenlet`. Use `selectinload()` / `joinedload()`.

**TanStack Query v5**: `onSuccess`/`onError` removed from `useQuery` — use `useEffect` or `useMutation`. `cacheTime` renamed to `gcTime`.

**nginx SPA fallback**: `try_files $uri $uri/ /index.html;` required — without it, F5 on any non-root route returns 404.

**API proxy trailing slash**: both sides need it — `location /api/ { proxy_pass http://api:8000/api/; }`.
