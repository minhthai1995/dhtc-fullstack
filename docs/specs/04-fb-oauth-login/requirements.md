# Requirements — Feature: Facebook OAuth Login (P5A)

**Version:** 0.1 (DRAFT — chờ review)
**Status:** 📝 Drafting
**Last updated:** 2026-05-20

---

## Mô tả

Cho phép khách hàng (role=customer) đăng nhập DHTC bằng tài khoản Facebook qua OAuth 2.0 standard flow (`email + public_profile`). Mục tiêu là giảm friction cho người dùng Đà Nẵng đã quen Facebook hơn web ecommerce — nhiều khách messenger fanpage hiện không có account email rõ ràng để register.

Phụ thuộc downstream: P5B (Messenger Customer Chat Plugin) sẽ encode `user.id` từ JWT vào `ref` param khi user click chat, để webhook P5C linking PSID ↔ user_id qua bản ghi `fb_profiles` mà spec này tạo.

---

## Người dùng mục tiêu

- **Customer (B2C):** Bấm "Đăng nhập Facebook" trên `/login` hoặc `/register` → 1 click qua FB authorize → JWT cấp + redirect về `/` đăng nhập sẵn. Không cần đặt mật khẩu mới.
- **Customer đã có account email cũ:** FB trả về email trùng với user hiện tại → tự động link (merge), giữ nguyên order history.

**Out of audience:** seller + admin không dùng FB login (giữ email+password vì cần audit trail + 2FA roadmap).

---

## Yêu cầu nghiệp vụ

### Phải có (Must have)

- [ ] Nút "Đăng nhập Facebook" trên `LoginPage.tsx` + `RegisterPage.tsx` (style consistent với existing button — màu green, icon FB SVG inline)
- [ ] Endpoint `GET /api/v1/auth/facebook/start` — sinh state nonce, set HttpOnly cookie, 307 redirect đến `https://www.facebook.com/v19.0/dialog/oauth?client_id=&redirect_uri=&state=&scope=email,public_profile&response_type=code`
- [ ] Endpoint `GET /api/v1/auth/facebook/callback?code=&state=` — verify state cookie, exchange code → access_token, fetch `/me?fields=id,email,first_name,last_name,picture.width(400).height(400)`, upsert User + FBProfile, issue JWT, 302 đến `FRONTEND_URL/auth/fb-return?token=<jwt>` (hoặc `?error=<readable_vi>` nếu fail)
- [ ] FE route mới `/auth/fb-return` — đọc `token` từ query, lưu vào sessionStorage giống flow login bình thường, navigate `/`
- [ ] Bảng mới `fb_profiles` (1:1 với users) chứa `fb_app_user_id`, email, first/last name, profile_pic_url, locale, raw_oauth_payload (JSONB), linked_at. Thiết kế **chừa chỗ cho messenger_psid** (P5C sẽ điền)
- [ ] Email merge: nếu FB trả email đã tồn tại trên `users.email` → link FBProfile vào user đó, không tạo user mới
- [ ] User mới qua FB login: role=customer mặc định, `is_active=True`, `hashed_password` set thành random unusable string (chặn login email+password với tài khoản FB-only)
- [ ] State cookie: HttpOnly + Secure (production) + SameSite=Lax, TTL 10 phút
- [ ] CSRF protection: state mismatch → 400 với message "Phiên đăng nhập đã hết hạn, vui lòng thử lại"
- [ ] FB API errors (rate limit, invalid code, app suspended) → redirect FE với `?error=<vi_message>` thay vì raw 500
- [ ] Config: `FACEBOOK_APP_ID`, `FACEBOOK_OAUTH_REDIRECT_URI`, `FRONTEND_URL` trong `.env.example` (giá trị mẫu; secret real chỉ trong `.env`)

### Không làm trong MVP (Out of scope)

- ❌ Login bằng FB cho seller/admin role (giữ email+password)
- ❌ Liên kết PSID Messenger ↔ user (đẩy sang P5C qua referral.ref hoặc User Profile API)
- ❌ Lưu FB access_token dài hạn (chỉ dùng 1 lần trong callback rồi vứt — giảm attack surface)
- ❌ Refresh / re-auth flow
- ❌ Logout khỏi FB session (chỉ logout khỏi DHTC)
- ❌ FB Login JS SDK trên FE (dùng standard OAuth redirect — đơn giản, không cần `xfbml`)
- ❌ Account unlink UI (chỉ DB column → seller support tự can thiệp nếu cần)
- ❌ Multi-FB-account 1 user (1 user = 1 fb_profiles row, unique constraint)
- ❌ Email change qua FB (nếu user đã có DHTC email, FB email khác → giữ DHTC email, FB email chỉ lưu vào fb_profiles cho reference)

---

## Ràng buộc kỹ thuật & bảo mật

- **Secrets** `FACEBOOK_APP_SECRET` chỉ trong `/backend/.env`, KHÔNG log, KHÔNG echo response, KHÔNG commit. Hook test verify .env.example không chứa giá trị thật.
- **State CSRF token**: random 32-byte hex qua `secrets.token_urlsafe(32)`, stored HttpOnly cookie. Verify constant-time compare (`hmac.compare_digest`).
- **Email trust model**: FB-returned email coi là verified (FB đã verify). Cảnh báo trong handoff.md: nếu policy thay đổi (user tạo FB với email người khác), phải đổi sang re-verify-by-OTP — coi như known limitation cho MVP.
- **Redirect URI hardening**: `FACEBOOK_OAUTH_REDIRECT_URI` phải khớp 100% với redirect_uri trong app FB (otherwise FB trả `redirect_uri_mismatch`). Document trong README.
- **Token in URL**: redirect về FE với `?token=<jwt>` — JWT lộ trong browser history/Referer header. Risk thấp với JWT TTL 24h, nhưng ghi trong handoff: P6 chuyển sang `Set-Cookie HttpOnly`. MVP chấp nhận do FE đang đọc JWT từ URL trong các flow khác đã.
- **Random unusable password**: `secrets.token_urlsafe(48)` + bcrypt → đảm bảo email+password login không thể vào tài khoản FB-only kể cả admin biết email.
- **DB constraint**: `fb_profiles.user_id` UNIQUE (1:1); `fb_app_user_id` UNIQUE (chặn 1 FB account login thành 2 user DHTC).
- **Migration**: Alembic autogen + manual review (autogen miss server_default + CHECK). Test SQLite-compat (asyncpg dialect khác — dùng `JSON` type chứ không `JSONB` để chạy được trên SQLite test).
- **CORS**: Callback là server-side redirect (không cần CORS). Start endpoint cũng server-side. FE `/auth/fb-return` chỉ đọc query, không cross-origin.
- **Production redirect_uri**: Phải HTTPS (FB requirement). Dev mode: ngrok/localhost.run hoặc `lvh.me` (FB chấp nhận localhost với app trong dev mode).

---

## Tests

Mỗi endpoint mới có tối thiểu happy path + error path. OAuth public endpoints không có "401 unauthorized" theo nghĩa thông thường — thay bằng "invalid state" tests.

### Backend (`tests/test_auth_facebook.py`)

1. `test_facebook_start_redirects_to_fb` — GET /start → 307, Location khớp `facebook.com/v19.0/dialog/oauth`, state cookie set HttpOnly
2. `test_facebook_start_state_cookie_is_httponly_lax` — cookie attrs đúng (HttpOnly, SameSite=Lax)
3. `test_facebook_callback_new_user_happy` — mock httpx response: code→token→/me, kết quả 302 với `?token=<jwt>`, DB có user + fb_profile
4. `test_facebook_callback_email_merge` — existing user same email → fb_profile linked, không tạo user thứ 2
5. `test_facebook_callback_no_email_granted` — FB trả không có field email → vẫn tạo user với synthetic email `fb_<app_user_id>@dhtc.local`, fb_profile.fb_email=null
6. `test_facebook_callback_invalid_state` — state mismatch cookie → 302 với `?error=invalid_state` (KHÔNG raw 400 — graceful)
7. `test_facebook_callback_fb_api_error` — mock FB trả `{error: {...}}` → 302 với `?error=fb_unavailable`
8. `test_facebook_callback_duplicate_fb_app_user_id` — login lại với cùng FB account → vẫn issue JWT cho user cũ (idempotent)

### Frontend (`frontend/tests/auth/FacebookLogin.test.tsx`)

1. `LoginPage` render "Đăng nhập Facebook" button → click → `window.location.href` set đúng `/api/v1/auth/facebook/start`
2. `/auth/fb-return` route đọc `?token=...` → call `setAuthToken` → navigate `/`
3. `/auth/fb-return` với `?error=invalid_state` → render toast Vietnamese + nút quay về login

### E2E (manual, không Playwright vì FB sandbox phức tạp)

Manual smoke checklist trong `handoff.md`:
- Tạo FB test user trong FB Developer Console
- Click login button → FB authorize page hiện → approve → redirect về `/auth/fb-return?token=...`
- Check sessionStorage có JWT
- Check `/admin/customers` thấy user mới với `fb_profiles` linked

---

## Success criteria

- [ ] Khách hàng click "Đăng nhập Facebook" trên `/login`, qua FB authorize (FB test user OK), redirect về `/` trong trạng thái logged-in
- [ ] DB có `users` + `fb_profiles` row link đúng
- [ ] Tests pytest `tests/test_auth_facebook.py` pass full (8 tests)
- [ ] `ruff check` + `tsc --noEmit` clean
- [ ] Conventional commits, 1 task/commit
- [ ] handoff.md + tasks.md tick xong
