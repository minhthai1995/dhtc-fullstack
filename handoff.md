# Handoff — fullstack-template

> **Đọc TL;DR bên dưới trước khi làm bất cứ điều gì. Phần session log đóng mặc định — Claude không tự mở.**

---

## TL;DR (đọc đầu phiên mới — ≤ 30 dòng)

- **Đây là:** Template SDD fullstack — không phải project business logic
- **Đã có:** Auth end-to-end ✅ (register → login → JWT → sessionStorage → protected routes)
- **Spec hiện tại:** `docs/specs/01-auth/` — tất cả tasks ✅ đã hoàn thành
- **Branch:** `main` — latest commit `762b26b`
- **Đang làm:** _(điền vào khi bắt đầu feature mới)_
- **Blocked:** _(điền nếu có)_
- **Files đang sửa:** _(điền nếu có file dở dang)_
- **Next session:** Điền `docs/specs/00-product-vision.md` → viết spec feature đầu tiên → `/spec <name>`

---

## Active context

→ Template đã có đủ infrastructure. Khi bắt đầu project thật:
1. Chạy `/spec <feature-name>` để tạo spec 4 file
2. Điền requirements → design → tasks → code → checklist
3. Xem `docs/adr/0001-tech-stack.md` nếu cần đổi stack

---

## Session log

<details>
<summary>2026-05-16 · Hoàn thiện auth flow + SDD infrastructure (15 files thay đổi)</summary>

**Làm gì:**
- Thêm `POST /auth/register` endpoint (thiếu trước đó mặc dù runbook đề cập)
- Tách `UserRead` từ `schemas/auth.py` → `schemas/user.py`
- Thêm `useCurrentUser` hook, `UserRead` type FE, `getMe()` API
- Update `Home.tsx` hiển thị user info thật
- Thêm 2 register tests (9 tests tổng, tất cả pass)
- Fix ruff B008/N806/I001, thêm `pydantic[email]` dep
- Tạo toàn bộ docs/ structure: specs, adr, runbooks
- Refactor CLAUDE.md → 80 dòng với @imports
- Tạo handoff.md, docs/structure.md

**Commit:** `762b26b` — feat: complete auth flow — register endpoint, useCurrentUser, schema split

</details>

<details>
<summary>2026-05-15 · Add .claude/ infrastructure (settings.json, hooks, agents, commands)</summary>

**Làm gì:**
- Tạo `.claude/settings.json` với allow/deny/ask permissions
- Tạo `hooks/block-dangerous.sh` (PreToolUse: chặn force push, --no-verify)
- Tạo `hooks/validate-types.sh` (PostToolUse: nhắc mypy/tsc sau khi edit)
- Tạo `.claude/agents/code-reviewer.md` + `db-architect.md`
- Tạo `.claude/commands/feature.md` (/feature scaffold) + `migration.md`
- Tạo `AGENTS.md` (universal brief cho Codex/Cursor/Copilot)

**Commit:** `4869cf6` — chore: add Claude Code project infrastructure (.claude/)

</details>

<details>
<summary>2026-05-15 · Init fullstack-template với auth end-to-end</summary>

**Làm gì:**
- React 19 + Vite 6 + TypeScript strict + Tailwind v4
- FastAPI 0.115 + SQLAlchemy 2.0 async + Alembic + bcrypt
- Auth flow: login → JWT → sessionStorage → ProtectedRoute
- CI: GitHub Actions parallel backend + frontend
- Docker multi-stage + nginx

**Commit:** `29e149e` — init: fullstack-template

</details>

---

## Cách update file này

Cuối mỗi phiên, cập nhật **TL;DR** và thêm **1 `<details>` block** mới vào đầu session log:

```markdown
<details>
<summary>YYYY-MM-DD · [mô tả 1 dòng những gì đã làm]</summary>

**Làm gì:** [gạch đầu dòng ngắn]
**Commit:** [sha] — [message]

</details>
```

**KHÔNG dùng file này như git log.** Chi tiết → `git log`. Handoff chỉ lưu state hiện tại + context khó khôi phục.  
**KHÔNG để file vượt 200 dòng.** Session cũ hơn 30 ngày → move sang `handoff-archive/YYYY-MM.md`.
