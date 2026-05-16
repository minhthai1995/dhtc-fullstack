# Checklist — Feature: Auth

**Tiêu chí "xong" — Claude tự verify trước khi báo hoàn thành**

---

## Backend

- [x] `POST /api/v1/auth/register` trả 201 với user mới
- [x] `POST /api/v1/auth/register` trả 409 nếu email đã tồn tại
- [x] `POST /api/v1/auth/login` trả 200 + `access_token` với đúng credentials
- [x] `POST /api/v1/auth/login` trả 401 với sai password
- [x] `GET /api/v1/users/me` trả 200 + user info với token hợp lệ
- [x] `GET /api/v1/users/me` trả 401 khi không có token
- [x] Password hash bằng `bcrypt` trực tiếp — không có `import passlib` nào
- [x] JWT `sub` = `str(user.id)` — không phải email
- [x] `uv run pytest -q` → tất cả pass (≥ 9 tests)
- [x] `uv run ruff check .` → không có lỗi
- [x] `uv run mypy app` → không có error (có thể có warning)

## Frontend

- [x] Đăng nhập thành công → token lưu vào `sessionStorage` (KHÔNG `localStorage`)
- [x] Đăng nhập thất bại → hiển thị error message, không crash
- [x] Route `/` cần auth → redirect về `/login` nếu chưa đăng nhập
- [x] Axios tự động gắn `Authorization: Bearer <token>` vào mọi request
- [x] 401 response → xóa token + redirect `/login` (không cần gọi thủ công)
- [x] `npm run typecheck` → 0 errors
- [x] `npm run build` → build thành công
- [x] `npm test` → tất cả pass

## Manual test (Postman / curl)

- [x] Register → Login → GET /me flow hoạt động end-to-end
- [x] Token hết hạn hoặc invalid → 401 response

## Documentation

- [x] `docs/specs/01-auth/requirements.md` — ghi rõ out-of-scope
- [x] `docs/specs/01-auth/design.md` — flow kỹ thuật + schema
- [x] `docs/specs/01-auth/tasks.md` — tất cả tasks đã tick ✅
- [x] `handoff.md` TL;DR đã cập nhật

---

## Verification command (chạy khi xong)

```bash
# Backend
cd backend && uv run pytest -q && uv run ruff check .

# Frontend
cd frontend && npm run typecheck && npm run build && npm test

# Smoke test (cần backend đang chạy)
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'
# Expected: {"id":1,"email":"test@example.com","is_active":true}
```
