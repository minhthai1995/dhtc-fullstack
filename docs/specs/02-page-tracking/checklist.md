# Checklist — Feature: Page Tracking (P2)

**Tiêu chí "xong" — Claude tự verify trước khi báo hoàn thành**

---

## Backend

- [ ] `POST /api/v1/tracking/page-view` trả 204 với payload hợp lệ
- [ ] `POST /tracking/page-view` chấp nhận request KHÔNG có Authorization
- [ ] `POST /tracking/page-view` link `user_id` khi Bearer hợp lệ
- [ ] `POST /tracking/page-view` trả 429 sau 60 request/phút từ cùng visitor_id
- [ ] `GET /admin/behavior/overview` trả 200 + cấu trúc BehaviorOverview đầy đủ
- [ ] `GET /admin/behavior/overview` trả 401 khi không có admin token
- [ ] `GET /admin/behavior/sessions` paginated hoạt động (`?limit=&offset=`)
- [ ] Alembic upgrade head + downgrade -1 chạy clean
- [ ] `uv run pytest tests/test_tracking.py tests/test_admin_behavior.py -q` pass
- [ ] `uv run ruff check app/` → 0 errors
- [ ] PageView model imported trong `models/__init__.py`

## Frontend

- [ ] Visit `/shop` → POST /tracking/page-view fire (check Network tab)
- [ ] Reload page → visitor_id giữ nguyên trong localStorage
- [ ] Đóng tab + mở lại → session_id mới
- [ ] Idle 30 phút → session_id reset (manual test với Date.now mock)
- [ ] Visit `/admin/dashboard` → KHÔNG fire tracking (admin routes excluded)
- [ ] Admin CRM tab "Hành vi" hiển thị data thực thay vì empty state
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run build` → build thành công

## E2E & Manual test

- [ ] Playwright e2e BehaviorTab passes
- [ ] Visit 5 trang khác nhau → admin tab Hành vi thấy 5 page views
- [ ] Top pages tab hiện top 10 đúng theo path
- [ ] 24h chart bar khớp giờ truy cập thực tế

## Documentation

- [ ] `docs/specs/02-page-tracking/requirements.md` — đã ghi rõ out-of-scope
- [ ] `docs/specs/02-page-tracking/design.md` — flow kỹ thuật + schema
- [ ] `docs/specs/02-page-tracking/tasks.md` — tất cả tasks đã tick ✅
- [ ] `handoff.md` TL;DR đã cập nhật

---

## Verification command (chạy khi xong)

```bash
# Backend
cd backend && uv run pytest -q && uv run ruff check app/

# Frontend
cd frontend && npm run typecheck && npm run build

# Smoke test (cần backend + frontend chạy)
curl -X POST http://localhost:8000/api/v1/tracking/page-view \
  -H "Content-Type: application/json" \
  -d '{"visitor_id":"test-uuid","session_id":"test-session","path":"/shop","referrer":null}'
# Expected: 204 No Content
```
