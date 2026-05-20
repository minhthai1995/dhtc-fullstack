# Tasks — Feature: Page Tracking (P2)

**Tổng thời gian ước tính:** ~12 giờ (2 ngày)
**Status:** 📝 Drafting — chờ duyệt spec

> **Cách dùng file này:**
> - Tick task khi xong: `- [x] T1 ✅`
> - Mỗi task = 1 commit
> - Task ≤ 30 phút — nếu lớn hơn thì chia nhỏ

---

## Backend — Models & Migration

- [x] **T1** ✅ — PageView SQLAlchemy model (commit `cd22647`)
- [x] **T2** ✅ — Alembic migration `page_views` (commit `9480096`)

## Backend — Tracking endpoint

- [x] **T3** ✅ — PageViewIn Pydantic schema (commit `a747650`)
- [x] **T4** ✅ — page_view CRUD (commit `c8cd994`)
- [x] **T5** ✅ — device/source/country derive helpers (commit `22c6418`)
- [x] **T6** ✅ — in-memory sliding-window rate limiter (commit `37fd193`)
- [x] **T7** ✅ — POST /tracking/page-view endpoint (commit `d7d9b8f`)

## Backend — Admin behavior aggregation

- [x] **T8** ✅ — behavior overview schemas (commit `a244496`)
- [x] **T9** ✅ — `/admin/behavior/overview` aggregation (commit `992fce0`)
- [x] **T10** ✅ — funnel cross-join with cart+orders (commit `992fce0`)
- [x] **T11** ✅ — `/admin/behavior/sessions` paginated (commit `992fce0`)

## Backend — Tests

- [x] **T12** ✅ — pytest tracking: happy + bearer-link + 60-then-429 + 422 (commit `be10ce8`)
- [x] **T13** ✅ — pytest admin behavior: 2 happy + 2 unauth (commit `6d18682`)

## Frontend — Tracking client

- [x] **T14** ✅ — `visitor.ts` getVisitorId + getSessionId (commit `07b493c`)
- [x] **T15** ✅ — `tracking.api.ts` sendPageView fire-and-forget (commit `7de5d9a`)
- [x] **T16** ✅ — `useTracking()` hook (commit `0029849`)
- [x] **T17** ✅ — wired vào `CustomerLayout` (commit `5c95766`)
- [x] **T18** ✅ — vitest 5 tests (commit `1dbfe59`)

## Frontend — Admin Behavior tab

- [x] **T19** ✅ — BehaviorOverview types + API (commit `3d0a4c0`)
- [x] **T20** ✅ — `useBehaviorOverview` + `useBehaviorSessions` hooks (commit `c5915cf`)
- [x] **T21** ✅ — BehaviorTab bind real data (commit `c71803e`)
- [x] **T22** ✅ — Playwright e2e BehaviorTab (commit `33e2532`)

## DevOps & Verification

- [x] **T23** ✅ — handoff.md TL;DR + session log entry
- [x] **T24** ✅ — tick toàn bộ tasks.md (checklist.md không tồn tại — bỏ qua)

---

## Tổng kết

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 24 | 24 ✅ |
| Tests | 4 (2 BE pytest + 1 FE unit + 1 e2e) | 4 BE pytest tracking + 4 BE pytest admin behavior + 5 vitest visitor + 2 Playwright = 15 |
| Files mới | 11 | 11 (5 BE, 4 FE tracking, 1 FE test, 1 spec) |
| Files edit | 5 | 6 (admin.py, admin.api.ts, useAdmin.ts, AdminCRM.tsx, CustomerLayout.tsx, admin.spec.ts) |
| Thời gian | ~12h | ~1 phiên (compressed via parallel ops) |
