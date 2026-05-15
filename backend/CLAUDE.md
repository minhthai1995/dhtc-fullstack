# Backend — CLAUDE.md

FastAPI 0.115 · Python 3.12 · SQLAlchemy 2.0 async · Alembic · bcrypt · PostgreSQL 16.

## Commands

```bash
uv sync --all-groups                              # install / sync deps
uv run uvicorn app.main:app --reload              # dev server :8000
uv run pytest -q                                  # tests (SQLite, no Postgres)
uv run pytest tests/test_auth.py -v               # single file
uv run ruff check . && uv run ruff format .
uv run mypy app

uv run alembic revision --autogenerate -m "msg"   # review output before applying
uv run alembic upgrade head
uv run alembic downgrade -1
uv run alembic history
```

## Layer rules

| Layer | Directory | Rule |
|-------|-----------|------|
| Routes | `app/api/v1/` | Validate input → call service/crud → return schema. No DB queries. |
| Services | `app/services/` | Business logic. Orchestrate crud. Raise HTTP exceptions here. |
| CRUD | `app/crud/` | Pure SQLAlchemy: `select` / `insert` / `update`. No business logic. |
| Models | `app/models/` | SQLAlchemy ORM. Every new model must be imported in `models/__init__.py`. |
| Schemas | `app/schemas/` | Pydantic v2. Use `ConfigDict(from_attributes=True)` for ORM reads. |

## Model checklist (for every new SQLAlchemy model)

- `__tablename__` is plural snake_case (`users`, `orders`)
- `id: Mapped[int] = mapped_column(primary_key=True)`
- Inherits `TimestampMixin` from `app.models.base` (adds `created_at`, `updated_at`)
- `Mapped[str]` = NOT NULL · `Mapped[str | None]` = nullable — intentional
- `String(255)` for email/name — not unbounded `String()`
- FK columns + search columns have `index=True`
- Imported in `app/models/__init__.py` (required for Alembic autogenerate + test conftest)

## Test setup

Tests use SQLite in-memory via `dependency_overrides[get_db]` in `tests/conftest.py`. No Postgres needed for `pytest`.

`asyncio_mode = "auto"` is set in `pyproject.toml` — required for pytest-asyncio.

Every new endpoint needs at minimum:
1. Happy path test
2. 401 unauthorized test (unauthenticated request)

## Critical gotchas (backend-specific)

- `current_user` must use `Depends(get_db)` — `Depends(db_session)` calls `get_db()` directly, bypassing `dependency_overrides` in tests.
- Never `from passlib.context import CryptContext` — use `import bcrypt` directly.
- Lazy loading raises `MissingGreenlet` — use `selectinload()` / `joinedload()` when needed.
- Alembic autogenerate misses: enum changes, `server_default`, CHECK constraints.
