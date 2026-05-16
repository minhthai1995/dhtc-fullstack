# Cấu trúc thư mục

```
.
├─ .claude/
│   ├─ agents/               subagent chuyên môn (code-reviewer, db-architect)
│   ├─ commands/             slash commands (/spec, /feature, /migration)
│   ├─ hooks/                PreToolUse / PostToolUse automation
│   └─ settings.json         tool permissions + hooks config
│
├─ docs/                     ★ Source of truth — KHÔNG phải lịch sử chat
│   ├─ specs/                1 folder/feature, mỗi folder có 4 file chuẩn
│   │   ├─ 00-product-vision.md
│   │   ├─ 01-auth/          ✅ Auth end-to-end — hoàn thành (dùng làm ví dụ)
│   │   │   ├─ requirements.md
│   │   │   ├─ design.md
│   │   │   ├─ tasks.md
│   │   │   └─ checklist.md
│   │   └─ <NN>-<feature>/   ← tạo bằng /spec <name>
│   │       ├─ requirements.md   ai dùng, làm gì, ràng buộc nghiệp vụ
│   │       ├─ design.md         endpoint, schema DB, flow kỹ thuật
│   │       ├─ tasks.md          task ≤ 30 phút, 1 task = 1 commit
│   │       └─ checklist.md      tiêu chí "xong" — Claude tự verify
│   ├─ adr/                  Architecture Decision Records
│   │   └─ 0001-tech-stack.md
│   └─ runbooks/             Hướng dẫn vận hành, deploy, rollback
│
├─ frontend/                 React 19 + Vite 6 + TypeScript + Tailwind v4
│   ├─ src/
│   │   ├─ features/<domain>/    <domain>.api.ts · use<Domain>.ts · page
│   │   ├─ components/ui/        Button · Card · Spinner
│   │   ├─ lib/                  axios.ts · cn.ts
│   │   ├─ pages/                Home · Login · NotFound
│   │   └─ types/api.ts
│   ├─ tests/
│   ├─ CLAUDE.md
│   └─ package.json
│
├─ backend/                  FastAPI + SQLAlchemy 2.0 async + Alembic
│   ├─ app/
│   │   ├─ api/v1/           routes: auth · health · users
│   │   ├─ core/             config · db · security
│   │   ├─ crud/             pure DB ops
│   │   ├─ models/           SQLAlchemy ORM
│   │   ├─ schemas/          Pydantic DTOs
│   │   ├─ services/         business logic
│   │   └─ deps.py           DI: get_db · current_user
│   ├─ alembic/
│   ├─ tests/
│   ├─ CLAUDE.md
│   └─ pyproject.toml
│
├─ CLAUDE.md                 ★ Hiến pháp dự án (50-100 dòng, @imports)
├─ AGENTS.md                 Universal brief (Codex/Cursor/Copilot compatible)
├─ handoff.md                Session-to-session state handoff
├─ docker-compose.yml
└─ .github/workflows/ci.yml
```
