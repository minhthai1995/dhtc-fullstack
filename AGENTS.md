# AGENTS.md

Universal agent brief for this repository — read by Claude Code, Codex, Cursor, Copilot, Gemini CLI, and any other AI coding assistant.

Stack: **React 19 + Vite 6 + TypeScript strict + Tailwind v4** (FE) · **FastAPI 0.115 + Python 3.12 + SQLAlchemy 2.0 async + Alembic** (BE)

---

## Project overview

Production-ready fullstack monorepo template. Auth wired end-to-end:
`POST /api/v1/auth/login` → JWT → `sessionStorage` → Axios `Authorization: Bearer` → `GET /api/v1/users/me`.

Use this as the starting point for any project needing a FastAPI REST API + React SPA.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 · Vite 6 · TypeScript strict · Tailwind v4 |
| State / routing | TanStack Query v5 · React Router v7 |
| HTTP client | Axios 1.x with interceptors |
| Backend | FastAPI 0.115 · Python 3.12 · Uvicorn |
| ORM | SQLAlchemy 2.0 async · asyncpg |
| Migrations | Alembic (autogenerate) |
| Auth | JWT (python-jose) · bcrypt 4.x directly |
| DB | PostgreSQL 16 · aiosqlite (tests) |
| Test BE | pytest-asyncio · httpx.AsyncClient · SQLite in-memory |
| Test FE | Vitest 2 · Testing Library · jsdom |
| CI | GitHub Actions — parallel backend + frontend jobs |
| Container | Docker multi-stage · nginx SPA |

---

## Repository layout

```
.
├── CLAUDE.md                  project rules for Claude Code
├── AGENTS.md                  this file — universal agent brief
├── docker-compose.yml
├── .github/workflows/ci.yml
├── .claude/
│   ├── settings.json          tool permissions + hooks
│   ├── commands/feature.md    /feature <name> — scaffold full feature
│   ├── commands/migration.md  /migration <msg> — create Alembic migration
│   ├── agents/code-reviewer.md
│   └── agents/db-architect.md
├── backend/
│   ├── CLAUDE.md              backend-specific context
│   ├── app/
│   │   ├── api/v1/            auth · health · users
│   │   ├── core/              config · db · security
│   │   ├── crud/              pure DB operations
│   │   ├── models/            SQLAlchemy ORM
│   │   ├── schemas/           Pydantic DTOs
│   │   ├── services/          business logic
│   │   └── deps.py            DI: get_db · current_user
│   ├── alembic/
│   └── tests/
└── frontend/
    ├── CLAUDE.md              frontend-specific context
    └── src/
        ├── features/auth/
        ├── components/ui/
        ├── lib/               axios · cn
        ├── pages/
        └── types/api.ts
```

---

## Architecture rules

### Backend — 3-layer separation (enforced)
- **Routes** (`api/v1/`): validate input → call service/crud → return Pydantic schema. No DB queries here.
- **Services** (`services/`): business logic, orchestration, domain errors.
- **CRUD** (`crud/`): pure SQLAlchemy queries, no `if` business logic.

### Frontend — feature-based structure
- One folder per domain: `src/features/<domain>/`
- `<domain>.api.ts` — all API calls for this domain
- `use<Domain>.ts` — TanStack Query hooks
- Page component imports from hooks, never calls API directly

---

## Non-negotiable rules

- **No passlib**: broken with bcrypt 4.x on Python 3.13+. Use `bcrypt.hashpw` / `bcrypt.checkpw` directly.
- **`current_user` uses `Depends(get_db)`**: `Depends(db_session)` bypasses test `dependency_overrides`.
- **JWT in `sessionStorage`**: never `localStorage` (XSS).
- **No `any` in TypeScript** without an explaining comment.
- **Separate vitest.config.ts**: merging test config into vite.config.ts causes type conflicts.
- **Alembic only for schema**: no `Base.metadata.create_all()` in production. Never `alembic upgrade head` in app startup.
- **Feature branches only**: never commit directly to `main`.

---

## Commands to run

```bash
# Backend
cd backend && uv run pytest -q                     # tests
cd backend && uv run ruff check .                  # lint
cd backend && uv run mypy app                      # types

# Frontend
cd frontend && npm test                            # tests
cd frontend && npm run typecheck                   # tsc --noEmit
cd frontend && npm run lint                        # eslint

# Full stack
docker compose up --build
```
