# Handoff — fullstack-template

> **Đọc TL;DR bên dưới trước khi làm bất cứ điều gì. Phần session log đóng mặc định — Claude không tự mở.**

---

## TL;DR (đọc đầu phiên mới — ≤ 30 dòng)

- **Đây là:** DHTC marketplace fullstack (Đà Nẵng truyền thống) — đã rời template, đang build feature thật
- **Đã có:** Auth ✅ · Admin/Seller/Customer portals ✅ · Chatbot Messenger ✅ · CRM admin 4-tab match mockup ✅
- **Vừa xong (2026-05-20):** Restructure `/admin/crm` → 4 tab khớp mockup (`Tổng quan / Khách hàng / Hội thoại / Hành vi`), gỡ AI-feel
  - BE: 3 endpoints mới (`/admin/crm/demographics`, `/conversation-overview`, `/conversations/{sid}/profile`) + helper `_classify_intent`
  - FE: xoá Intent Clusters fake demo, thêm Demographics row + ConversationsTab + BehaviorTab (P2 placeholder honest)
  - Tests: 6 pytest (3 happy + 3 401) pass · 2 Playwright e2e (4-tab navigate + no-AI-residue) pass
- **Branch:** `main` — chuẩn bị commit lớn (toàn bộ DHTC app chưa từng vào git)
- **Blocked:** _(không)_
- **Files đang sửa:** _(không — work đã xong, chờ commit)_
- **Next session:** P2 page tracking (pixel JS + `page_views` table) cho tab Hành vi; response time/conversion compute

---

## Active context

→ Sau commit lớn này, dirty tree sẽ về clean. Lần sau nhớ commit theo task để tránh dồn.
→ Pre-existing test failure trong `test_orders.py::test_cancel_order_restores_stock` (OrderEvent.created_at `'now()'` isoformat) — không phải do CRM work, để xử lý riêng.
→ Backend ruff có 66 lỗi pre-existing (F401/F811/E501/F841) — không gate CI hiện tại, cleanup sau.

---

## Session log

<details>
<summary>2026-05-20 · CRM admin restructure 4 tab khớp mockup + gỡ AI-feel</summary>

**Làm gì:**
- BE `admin.py`: thêm `GET /admin/crm/demographics` (by_source/by_country/by_device), `GET /admin/crm/conversation-overview` (stats/intent_breakdown/trend_7d/funnel), `GET /admin/crm/conversations/{session_id}/profile` (linked_user qua phone/email regex, intent_history)
- BE helper `_classify_intent`: 5 cluster keyword match (product_search/price_inquiry/order_lookup/shipping_inquiry/complaint)
- FE `AdminCRM.tsx`: xoá Intent Clusters fake demo + nhãn "Demo — AI phân loại tự động"; restructure 3→4 tabs khớp mockup `/DHTC/admin/crm/*.html`
- FE thêm ConversationsTab (KPI strip · intent bars · 7-day mini chart · funnel · conversation table click → drawer) và BehaviorTab (banner P2 · 4 KPI "—" · 3 empty state · funnel skeleton · 24h chart)
- FE thêm `SourceBadge`, `CountryFlag`, `MiniBarChart`, `HourlyBarChart`, `EmptyState`, `ConversationDetailDrawer` 3-pane
- Tests: `tests/test_admin_crm.py` (6 pytest, happy + 401 cho mỗi endpoint) + 2 Playwright e2e (4-tab navigate, no-AI-residue) — tất cả pass

**Commit:** sẽ điền sau khi commit

</details>

<details>
<summary>2026-05-16 · Hoàn thiện SDD infrastructure — /spec command, session ritual, bài giảng</summary>

**Làm gì:**
- Tạo `.claude/commands/spec.md` — `/spec <name>` scaffold 4-file spec với template đầy đủ
- CLAUDE.md: thêm session ritual (ĐẦU/TRONG/CUỐI phiên), Verification Gate, "Luôn lưu plan"
- `docs/structure.md`: cập nhật — thêm `01-auth/`, `/spec` command
- `handoff.md`: refactor sang TL;DR + `<details>` collapsed pattern (≤200 dòng)
- `course_content.html`: CLAUDE.md v0 template thêm session ritual + Verification Gate; React 18→19; tasks.md example hiển thị ticked ✅ pattern

**Commit:** `432fbba` — feat: add SDD infrastructure — /spec command, auth spec, session ritual in CLAUDE.md

</details>

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
