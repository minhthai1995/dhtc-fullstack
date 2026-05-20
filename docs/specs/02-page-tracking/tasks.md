# Tasks — Feature: Page Tracking (P2)

**Tổng thời gian ước tính:** ~12 giờ (2 ngày)
**Status:** 📝 Drafting — chờ duyệt spec

> **Cách dùng file này:**
> - Tick task khi xong: `- [x] T1 ✅`
> - Mỗi task = 1 commit
> - Task ≤ 30 phút — nếu lớn hơn thì chia nhỏ

---

## Backend — Models & Migration

- [ ] **T1** (15') — Tạo `PageView` SQLAlchemy model (kế thừa `TimestampMixin`, imported vào `models/__init__.py`)
  File: `backend/app/models/page_view.py`
  Commit: `feat(tracking): add PageView model`

- [ ] **T2** (15') — Alembic autogenerate migration cho `page_views` table + review SQL output
  File: `backend/alembic/versions/2026_05_20_XXXX_add_page_views.py`
  Commit: `feat(tracking): alembic migration for page_views`

## Backend — Tracking endpoint

- [ ] **T3** (15') — Pydantic schema `PageViewIn`
  File: `backend/app/schemas/tracking.py`
  Commit: `feat(tracking): add PageViewIn schema`

- [ ] **T4** (20') — CRUD layer: `create_page_view`, `get_for_date`, `count_distinct_sessions`
  File: `backend/app/crud/page_view.py`
  Commit: `feat(tracking): add page_view CRUD`

- [ ] **T5** (20') — Service helpers: `derive_device`, `derive_source`, optional country parse từ header
  File: `backend/app/services/tracking.py`
  Commit: `feat(tracking): add device/source derivation helpers`

- [ ] **T6** (20') — Rate limit decorator (in-memory dict, max 60/min/visitor_id) — đủ MVP, KHÔNG cần Redis
  File: `backend/app/core/rate_limit.py` (NEW) hoặc inline trong tracking.py
  Commit: `feat(tracking): add in-memory rate limit`

- [ ] **T7** (25') — Route `POST /api/v1/tracking/page-view` (optional Bearer, parse UA, rate-limit, insert)
  File: `backend/app/api/v1/tracking.py` + wire vào `api/v1/__init__.py`
  Commit: `feat(tracking): add POST /tracking/page-view endpoint`

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

- [ ] **T12** (30') — pytest: happy + 429 rate-limit + optional Bearer cho POST tracking endpoint
  File: `backend/tests/test_tracking.py` (NEW)
  Commit: `test(tracking): add page-view endpoint tests`

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
