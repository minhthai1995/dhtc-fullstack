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

- [ ] **T8** (20') — Pydantic schemas: `BehaviorOverview`, `BehaviorStats`, `DeviceBucket`, `SourceBucket`, `TopPage`, `BehaviorFunnelStage`, `HourlyBucket`, `SessionSummary`
  File: `backend/app/schemas/admin_behavior.py`
  Commit: `feat(admin-behavior): add behavior overview schemas`

- [ ] **T9** (30') — Aggregation query (stats + by_device + by_source + top_pages + hourly_24h)
  File: `backend/app/api/v1/admin.py` (APPEND `GET /admin/behavior/overview`)
  Commit: `feat(admin-behavior): add /admin/behavior/overview endpoint`

- [ ] **T10** (25') — Funnel logic: view_product/checkout từ page_views + add_to_cart/complete từ existing cart/orders tables
  File: `backend/app/api/v1/admin.py` (extend T9)
  Commit: `feat(admin-behavior): add funnel cross-join with orders/cart`

- [ ] **T11** (20') — `GET /admin/behavior/sessions` paginated list
  File: `backend/app/api/v1/admin.py`
  Commit: `feat(admin-behavior): add /admin/behavior/sessions endpoint`

## Backend — Tests

- [x] **T12** ✅ — pytest tracking: happy + bearer-link + 60-then-429 + 422 (commit `be10ce8`)

- [ ] **T13** (30') — pytest: happy + 401 unauth cho 2 admin behavior endpoints (seed page_views + cart + orders)
  File: `backend/tests/test_admin_behavior.py` (NEW)
  Commit: `test(admin-behavior): add behavior overview tests`

## Frontend — Tracking client

- [ ] **T14** (20') — `visitor.ts`: getVisitorId() (localStorage), getSessionId() (sessionStorage + 30' idle reset)
  File: `frontend/src/features/tracking/visitor.ts`
  Commit: `feat(tracking): add visitor + session id helpers`

- [ ] **T15** (15') — `tracking.api.ts`: sendPageView() fire-and-forget
  File: `frontend/src/features/tracking/tracking.api.ts`
  Commit: `feat(tracking): add sendPageView API function`

- [ ] **T16** (20') — `useTracking()` hook gắn vào React Router listener
  File: `frontend/src/features/tracking/useTracking.ts`
  Commit: `feat(tracking): add useTracking hook`

- [ ] **T17** (15') — Wire `useTracking()` vào `CustomerLayout.tsx` (CHỈ customer routes, KHÔNG admin/seller)
  File: `frontend/src/components/layout/CustomerLayout.tsx`
  Commit: `feat(tracking): wire tracking into CustomerLayout`

- [ ] **T18** (15') — Unit test: visitor_id persistence, session reset sau 30' idle (mock localStorage + Date.now)
  File: `frontend/tests/tracking/visitor.test.ts`
  Commit: `test(tracking): add visitor.ts unit tests`

## Frontend — Admin Behavior tab

- [ ] **T19** (15') — Types `BehaviorOverview` + API function `getBehaviorOverview()` trong `admin.api.ts`
  File: `frontend/src/features/admin/admin.api.ts`
  Commit: `feat(admin-behavior): add behavior overview API types`

- [ ] **T20** (10') — Hook `useBehaviorOverview()` trong `useAdmin.ts`
  File: `frontend/src/features/admin/useAdmin.ts`
  Commit: `feat(admin-behavior): add useBehaviorOverview hook`

- [ ] **T21** (30') — Rebind `BehaviorTab` trong `AdminCRM.tsx`: thay empty state bằng data thực, giữ P2 banner thành P2 ribbon nhỏ (đã shipped)
  File: `frontend/src/pages/admin/AdminCRM.tsx`
  Commit: `feat(admin-behavior): bind BehaviorTab to real data`

- [ ] **T22** (20') — Playwright e2e: behavior tab có data thực (count > 0 sau khi seed)
  File: `frontend/e2e/admin.spec.ts`
  Commit: `test(admin-behavior): e2e for BehaviorTab real data`

## DevOps & Verification

- [ ] **T23** (10') — Update `handoff.md` TL;DR + thêm session log entry
  File: `handoff.md`
  Commit: `docs: update handoff for page-tracking feature`

- [ ] **T24** (5') — Tick toàn bộ `tasks.md` ✅ + tick `checklist.md`
  Files: `docs/specs/02-page-tracking/tasks.md`, `checklist.md`
  Commit: `docs(02-page-tracking): mark feature complete`

---

## Tổng kết

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 24 | _ |
| Tests | 4 (2 BE pytest + 1 FE unit + 1 e2e) | _ |
| Files mới | 11 | _ |
| Files edit | 5 | _ |
| Thời gian | ~12h | _ |
