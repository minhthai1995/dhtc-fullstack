# Handoff — P5A · Facebook OAuth Login

## TL;DR

- **Trạng thái:** Code + tests DONE. Backend 9/9 pytest pass (full suite 74/75, 1 pre-existing fail unrelated). Frontend 70/70 vitest pass. Type-check clean.
- **Chưa làm:** Manual e2e với FB Test User (cần FB App live) + handoff TL;DR top-level (T28) + final ruff/build sweep (T29) + tick tasks 100% (T30).
- **Hành động cần user:**
  1. Tạo FB App ở [developers.facebook.com](https://developers.facebook.com/) (loại Consumer → Facebook Login enabled)
  2. Vào **Roles → Test Users** tạo 1 test user (có email)
  3. Vào **App Settings → Basic** → copy `App ID` + `App Secret`
  4. Vào **Facebook Login → Settings** thêm Valid OAuth Redirect URI: `http://localhost:8000/api/v1/auth/facebook/callback`
  5. Điền vào `backend/.env` (KHÔNG commit):
     ```
     FACEBOOK_APP_ID=<from step 3>
     FACEBOOK_APP_SECRET=<from step 3>
     FACEBOOK_OAUTH_REDIRECT_URI=http://localhost:8000/api/v1/auth/facebook/callback
     FRONTEND_URL=http://localhost:5173
     ```
  6. Chạy smoke checklist bên dưới

## Known limitation (defer P6)

Token được pass qua **URL query string** ở redirect cuối (`/auth/fb-return?token=<jwt>`). Trade-off:
- URL có thể leak qua `Referer` header sang trang khác user click sau khi login, log của reverse proxy, hoặc browser history.
- Mitigation hiện tại: FE `useEffect` xóa token khỏi URL ngay sau khi đọc bằng `navigate('/', { replace: true })` → history không giữ.
- P6 sẽ thay bằng HttpOnly cookie + `/auth/me` bootstrap, hoặc one-shot `code` redirect tới FE rồi FE call BE `POST /auth/fb-exchange` lấy token.

## Reserved cho P5C

`fb_profiles.messenger_psid` (UNIQUE, nullable) đã có sẵn — P5C webhook ánh xạ Messenger sender_id → user khi user chat đầu tiên sau khi đã FB-login web.

---

## Manual e2e smoke checklist

Chạy theo thứ tự. Tick từng bước. Nếu fail bất kỳ bước nào → ghi vào "Findings" cuối file.

### Pre-flight

- [ ] Backend chạy: `cd backend && uv run uvicorn app.main:app --reload --port 8000`
- [ ] Frontend chạy: `cd frontend && npm run dev` (port 5173)
- [ ] `.env` đã có 4 keys FB ở trên
- [ ] DB đã migrate: `cd backend && uv run alembic upgrade head` → cuối log thấy `create_fb_profiles`
- [ ] Bạn đang login vào FB browser bằng FB **Test User** (không phải account thật) — `developers.facebook.com → My Apps → <App> → Roles → Test Users → Open in Facebook`

### Flow 1 — New user happy path

- [ ] Mở `http://localhost:5173/login` (incognito ưu tiên — không state cũ)
- [ ] Thấy nút **"Tiếp tục với Facebook"** màu xanh FB bên dưới form login, có divider "hoặc"
- [ ] Click → URL bar chuyển sang `facebook.com/v19.0/dialog/oauth?client_id=...`
- [ ] FB hiện dialog xin permission `email + public_profile` → bấm **Continue**
- [ ] Tự redirect về `localhost:8000/api/v1/auth/facebook/callback?code=...&state=...`
- [ ] Rồi redirect tiếp về `localhost:5173/auth/fb-return?token=<jwt>` → chớp loading "Đang hoàn tất đăng nhập…"
- [ ] Vào `/` rồi auto-route theo role (customer → `/shop`)
- [ ] DevTools → Application → Session Storage có key `access_token`
- [ ] DevTools → Application → Cookies KHÔNG còn `fb_oauth_state` (đã clear khi callback)
- [ ] DB verify: `psql -h localhost -p 5433 -U dhtc -d dhtc -c "SELECT u.id, u.email, p.fb_app_user_id, p.fb_first_name, p.fb_last_name FROM users u JOIN fb_profiles p ON p.user_id = u.id ORDER BY u.id DESC LIMIT 5;"` — thấy đúng FB test user

### Flow 2 — Re-login idempotent

- [ ] Logout từ DHTC UI
- [ ] Click FB button lần nữa → flow lặp lại
- [ ] DB verify: `SELECT COUNT(*) FROM users WHERE email = '<email FB test user>';` → vẫn `1`
- [ ] `SELECT COUNT(*) FROM fb_profiles WHERE fb_app_user_id = '<fb id>';` → vẫn `1`

### Flow 3 — Email merge

- [ ] Logout
- [ ] Vào `/register` → tạo account email/password với CHÍNH email của FB test user (`testuser_xxx@tfbnw.net` chẳng hạn). Password tự đặt.
- [ ] Logout
- [ ] Click FB button → login với cùng FB test user
- [ ] Login thành công, KHÔNG có user thứ 2 tạo ra
- [ ] DB verify: `SELECT u.id, COUNT(p.id) FROM users u LEFT JOIN fb_profiles p ON p.user_id = u.id WHERE u.email = '<email>' GROUP BY u.id;` — 1 user, 1 fb_profile linked
- [ ] User vẫn có thể login lại bằng email/password (mật khẩu cũ còn nguyên)

### Flow 4 — User cancels

- [ ] Logout
- [ ] Click FB button → ở dialog FB bấm **Cancel** (góc dưới)
- [ ] Redirect về `/auth/fb-return?error=user_cancelled`
- [ ] Thấy error card: "Bạn đã hủy đăng nhập bằng Facebook."
- [ ] Click "Quay lại đăng nhập" → về `/login`

### Flow 5 — Invalid state (tamper)

- [ ] Mở `/login` → DevTools → Application → Cookies → xóa `fb_oauth_state` nếu có
- [ ] Manually visit `http://localhost:8000/api/v1/auth/facebook/callback?code=fake&state=evil`
- [ ] Redirect về `/auth/fb-return?error=invalid_state`
- [ ] Thấy error card VN: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ."

### Flow 6 — Server-side check

- [ ] `grep -ri 'FACEBOOK_APP_SECRET' backend/app/` — chỉ xuất hiện trong `config.py` (load env) và `facebook_oauth_service.py` (POST tới FB). Không có ở log, không có ở response.
- [ ] Tail backend log khi chạy flow 1 — không thấy access_token nào in ra
- [ ] Verify CSRF cookie attrs trong DevTools → Cookies → `fb_oauth_state` row có `HttpOnly ✓`, `SameSite=Lax`, `Max-Age=600`

---

## Findings (điền sau khi smoke)

_(điền sau khi user chạy xong; ghi pass/fail từng flow + screenshot nếu fail)_

---

## Files touched (commits)

| Layer | File | Commit |
|-------|------|--------|
| BE config | `app/core/config.py`, `.env.example` | `1c23568` |
| BE model | `app/models/fb_profile.py` | `980247c` |
| BE registry | `app/models/__init__.py` | `aeb5efd` + `8687ff7` (ChatMessage fix) |
| BE migration | `alembic/versions/2026_05_20_1441_create_fb_profiles.py` | `125a6ea` |
| BE schemas | `app/schemas/fb_profile.py` | `8db5261` |
| BE CRUD | `app/crud/fb_profile.py` | `9f13798` |
| BE service | `app/services/facebook_oauth_service.py` | `331b13b`, `6ec52d4`, `4529178`, `436256e` |
| BE router | `app/api/v1/auth_facebook.py` | `cd748ad`, `fdb5cf6` |
| BE mount | `app/api/v1/__init__.py` | `61579c5` |
| BE tests | `tests/test_auth_facebook.py`, `tests/conftest.py` | `b6723c1`, `1fbbd54`, `24013f0`, `8e03b7b`, `dcca9d4`, `de4a46c`, `3356224` |
| FE button | `src/features/auth/FacebookLoginButton.tsx` | `489173c` |
| FE wire | `src/pages/Login.tsx`, `src/pages/Register.tsx` | `ceb915d` |
| FE return | `src/pages/auth/FacebookReturnPage.tsx` | `a65ae78` |
| FE route | `src/App.tsx` | `46f38a3` |
| FE tests | `tests/auth/FacebookLogin.test.tsx` | `d64be1f` |
