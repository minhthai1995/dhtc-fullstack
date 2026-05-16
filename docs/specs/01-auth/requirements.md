# Requirements — Feature: Auth

**Version:** 1.0  
**Status:** ✅ Implemented  
**Last updated:** 2026-05-16

---

## Mô tả

Hệ thống xác thực người dùng: đăng ký, đăng nhập, lấy thông tin tài khoản. Là nền tảng bắt buộc cho mọi feature cần bảo vệ route.

---

## Người dùng mục tiêu

- **User cuối:** Bất kỳ ai có tài khoản trong hệ thống
- **Quy mô MVP:** Single-tenant, không có admin panel phức tạp

---

## Yêu cầu nghiệp vụ

### Phải có (Must have)

- [ ] User có thể đăng ký bằng email + mật khẩu
- [ ] User có thể đăng nhập và nhận JWT access token
- [ ] User có thể xem thông tin tài khoản của mình (`/me`)
- [ ] Route được bảo vệ redirect về `/login` nếu chưa xác thực
- [ ] Token hết hạn sau 24 giờ

### Không làm trong MVP (Out of scope)

- ❌ OAuth / Google login
- ❌ Refresh token (sẽ làm ở ADR riêng nếu cần)
- ❌ Email verification
- ❌ Quên mật khẩu / reset password
- ❌ Multi-tenant / phân quyền role

---

## Ràng buộc bảo mật

- Mật khẩu hash bằng bcrypt 4.x trực tiếp — **KHÔNG dùng passlib**
- JWT lưu trong `sessionStorage` — **KHÔNG dùng `localStorage`** (XSS risk)
- Token attach tự động qua Axios interceptor
- 401 response → xóa token + redirect `/login` tự động

---

## Tiêu chí chấp nhận (Acceptance criteria)

```
GIVEN user chưa có tài khoản
WHEN POST /api/v1/auth/register với email + password hợp lệ
THEN trả về 201 + UserRead (id, email, is_active)

GIVEN email đã tồn tại
WHEN POST /api/v1/auth/register với email đó
THEN trả về 409 Conflict

GIVEN user đã đăng ký
WHEN POST /api/v1/auth/login với đúng credentials
THEN trả về 200 + access_token (JWT)

GIVEN token hợp lệ
WHEN GET /api/v1/users/me với Bearer token
THEN trả về 200 + thông tin user

GIVEN không có token
WHEN GET /api/v1/users/me
THEN trả về 401 Unauthorized
```
