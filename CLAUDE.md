# CLAUDE.md — fullstack-template

Fullstack monorepo template cho **Spec-Driven Development**. Auth wired end-to-end: login → JWT → sessionStorage → protected routes.

## Stack (KHÔNG thay đổi không hỏi)

- Frontend: React 19 + Vite 6 + TypeScript strict + Tailwind v4
- Backend: FastAPI 0.115 + Python 3.12 + SQLAlchemy 2.0 async + Pydantic v2
- Database: PostgreSQL 16 + Alembic (KHÔNG dùng create_all() trong production)
- Auth: JWT (python-jose) + bcrypt 4.x — **KHÔNG dùng passlib** (broken)
- Container: Docker multi-stage + nginx

Chi tiết stack + rationale: `docs/adr/0001-tech-stack.md`

## Quy tắc làm việc

1. **Spec-first.** Feature mới → tạo `docs/specs/<NN>-<feature>/` với 4 file (requirements.md, design.md, tasks.md, checklist.md). Đợi duyệt xong mới code.
2. **Plan Mode.** Mọi thay đổi > 1 file → Shift+Tab trước. Đợi approve.
3. **Test bắt buộc.** Mọi endpoint BE có pytest. Coverage ≥ 70%.
4. **Conventional Commits.** `feat:|fix:|docs:|refactor:|chore:|test:`
5. **KHÔNG commit secrets.** Dùng `.env` + `.env.example`.
6. **ADR trước quyết định lớn.** Thay stack/pattern → tạo `docs/adr/NNNN-<title>.md` trước.

## Cấu trúc thư mục

@docs/structure.md

## Quy tắc viết code

- Backend: @backend/CLAUDE.md
- Frontend: @frontend/CLAUDE.md

## Build & test nhanh

```bash
cd backend && uv run pytest -q                    # BE tests (SQLite, không cần Postgres)
cd frontend && npm test                           # FE tests
cd backend && uv run ruff check .                 # lint
cd frontend && npm run typecheck                  # tsc --noEmit
docker compose up --build                        # full stack
```

## Verify trước khi báo "xong"

- [ ] `uv run pytest -q` pass
- [ ] `npm run typecheck && npm run build` pass
- [ ] `uv run ruff check .` pass
- [ ] Committed với Conventional Commits
- [ ] Spec/ADR cập nhật nếu có thay đổi architecture

## Session state

Xem `handoff.md` — đọc trước mỗi phiên mới.
