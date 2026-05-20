# Plan — Feature: Facebook OAuth Login (P5A)

**Version:** 0.1 (DRAFT — chờ review)
**Status:** 📝 Drafting
**Last updated:** 2026-05-20

---

## Phases

### Phase 1 — Backend OAuth pipeline (~3.5h)

**Mục tiêu:** 2 endpoint `/auth/facebook/start` + `/auth/facebook/callback` chạy được, DB có `fb_profiles`, 8 pytest pass.

- Add config keys `FACEBOOK_APP_ID`, `FACEBOOK_OAUTH_REDIRECT_URI`, `FRONTEND_URL` vào `core/config.py` + `.env.example` (giá trị mẫu, không secret thật)
- Model `app/models/fb_profile.py` — table `fb_profiles` 1:1 với users, kèm cột `messenger_psid` reserved cho P5C
- Import `FBProfile` vào `app/models/__init__.py` (yêu cầu Alembic autogen + test conftest pick up)
- Schema Pydantic `app/schemas/fb_profile.py` — `FBProfileOut` (read), `FBProfileCreate` (internal)
- Service `app/services/facebook_oauth_service.py`:
  - `build_authorize_url(state)` → URL `facebook.com/v19.0/dialog/oauth` với scope `email,public_profile`
  - `exchange_code_for_token(code)` → httpx POST `graph.facebook.com/v19.0/oauth/access_token` → access_token
  - `fetch_user_profile(token)` → httpx GET `/me?fields=id,email,first_name,last_name,picture.width(400).height(400)`
  - `upsert_user_and_profile(payload)` → check email merge → create user (random unusable password) hoặc link FBProfile vào user cũ → return User
- CRUD `app/crud/fb_profile.py` — `get_by_fb_app_user_id`, `get_by_user_id`, `create`, `update_oauth_payload`
- Router `app/api/v1/auth_facebook.py`:
  - `GET /auth/facebook/start` → sinh state `secrets.token_urlsafe(32)` → set HttpOnly+Lax cookie 10min TTL → 307 redirect FB dialog
  - `GET /auth/facebook/callback?code=&state=` → verify state (`hmac.compare_digest`) → exchange + fetch + upsert → issue JWT → 302 `FRONTEND_URL/auth/fb-return?token=<jwt>` (hoặc `?error=<readable_vi>`)
- Mount router vào `app/main.py`
- Alembic migration `create_fb_profiles` — autogen rồi manual review (chừa `messenger_psid` nullable + UNIQUE constraint, `raw_oauth_payload` dùng `JSON` không `JSONB`)
- pytest `tests/test_auth_facebook.py` — 8 tests (xem requirements.md)
  - Mock `httpx.AsyncClient` qua `respx` hoặc monkey-patch
  - Fixture `fb_oauth_mocks` cho /token + /me responses

**Done when:**
- `uv run pytest tests/test_auth_facebook.py -v` → 8/8 pass
- Manual `curl -i http://localhost:8000/api/v1/auth/facebook/start` → 307 Location khớp `facebook.com/v19.0/dialog/oauth`, response có `Set-Cookie: fb_oauth_state=...; HttpOnly; SameSite=Lax`
- `uv run alembic upgrade head` clean trên dev DB, downgrade -1 không lỗi

---

### Phase 2 — Frontend button + return route (~2h)

**Mục tiêu:** Nút "Đăng nhập Facebook" trên `/login` + `/register`, route `/auth/fb-return` đọc JWT đăng nhập sẵn.

- Component `frontend/src/features/auth/FacebookLoginButton.tsx`:
  - Style match existing button (green, full-width on mobile, icon FB SVG inline 18px)
  - `onClick` → `window.location.href = '/api/v1/auth/facebook/start'` (full-page redirect, không AJAX)
  - i18n VI: "Đăng nhập Facebook"
- Thêm `<FacebookLoginButton />` vào `LoginPage.tsx` + `RegisterPage.tsx` (dưới form, có divider "hoặc")
- Route mới trong `frontend/src/App.tsx` (hoặc router config file):
  - `<Route path="/auth/fb-return" element={<FacebookReturnPage />} />`
- Page `frontend/src/pages/auth/FacebookReturnPage.tsx`:
  - `useSearchParams` đọc `token` + `error`
  - Nếu có `token` → `setAuthToken(token)` (reuse existing helper) + navigate `/`
  - Nếu có `error` → toast tiếng Việt + render button "Quay về đăng nhập" → navigate `/login`
  - Loading state ngắn (200ms) trước khi navigate để tránh flash
- vitest `frontend/tests/auth/FacebookLogin.test.tsx` — 3 tests (xem requirements.md)

**Done when:**
- `cd frontend && npm run typecheck` clean
- `npm test -- FacebookLogin` → 3/3 pass
- Manual: mở `/login` thấy nút FB, click → redirect đến `facebook.com/v19.0/dialog/oauth` (FB app trong dev mode hiện consent screen)

---

### Phase 3 — Integration smoke + handoff (~1.5h)

**Mục tiêu:** Manual e2e với FB test user pass, handoff.md + tasks.md cập nhật.

- Tạo FB app trong dev mode trên `developers.facebook.com`:
  - App type: Consumer
  - Add product: Facebook Login
  - Valid OAuth Redirect URIs: `http://localhost:8000/api/v1/auth/facebook/callback`
  - Copy App ID + App Secret vào `/backend/.env` (KHÔNG commit)
- Tạo FB test user trong App Dashboard → Roles → Test Users
- Manual smoke flow:
  1. `docker compose up` hoặc local `uv run uvicorn` + `npm run dev`
  2. Mở `localhost:5173/login` → click "Đăng nhập Facebook"
  3. FB consent screen hiện → approve với test user
  4. Redirect về `localhost:5173/auth/fb-return?token=...` → tự navigate `/`
  5. Verify `sessionStorage.authToken` set
  6. Verify `/admin/customers` (login admin tab khác) thấy user mới với fb_profile linked
- Edge cases manual:
  - Approve rồi cancel giữa chừng → error message tiếng Việt hiện ra ở `/auth/fb-return`
  - State mismatch (manual edit cookie) → `?error=invalid_state` redirect
  - FB email trùng email user cũ → user cũ được link, không tạo user mới (verify qua DB query)
- Update `handoff.md` TL;DR với:
  - Phase status (P5A done)
  - Known limitation: token-in-URL cần migrate sang Set-Cookie HttpOnly ở P6
  - Hand-off note cho P5B/P5C: `fb_profiles.messenger_psid` đã có sẵn column
- Tick `tasks.md` 100%

**Done when:**
- Manual smoke 6 bước trên pass đủ
- `uv run ruff check .` + `uv run mypy app` clean
- `npm run typecheck && npm run build` clean
- handoff.md TL;DR có entry P5A done
- Conventional commit history rõ ràng (1 task = 1 commit, ≤72 chars subject)

---

## Risks

| Risk | Mitigation |
|------|------------|
| FB app review chặn `email` scope trong production | `email` + `public_profile` là default tier, KHÔNG cần app review. Document rõ trong handoff |
| `redirect_uri_mismatch` khi deploy production | README ghi rõ phải khớp 100% `FACEBOOK_OAUTH_REDIRECT_URI` env với FB app config. Add `prod` + `staging` URI riêng vào app, không xài 1 cái cho all envs |
| User cancel/deny FB authorize → FB redirect callback với `error=access_denied` | Service detect param `error_reason` trong callback → redirect FE với `?error=user_cancelled` thay vì raw 500 |
| `httpx` timeout với FB graph API chậm | `httpx.AsyncClient(timeout=8.0)` — fail fast, redirect FE `?error=fb_timeout` thay vì block user 30s |
| Token-in-URL leak qua Referer header | Known limitation, JWT TTL 24h giảm risk; P6 migrate sang HttpOnly cookie. Document trong handoff |
| State cookie không set được khi user disable third-party cookies | SameSite=Lax (không Strict) → first-party cookie vẫn work; document edge case |
| Test với `respx` mock httpx async — fragile nếu FB đổi response shape | Fixtures hardcoded format từ FB docs hiện tại; test failure = signal review docs version |
| Alembic autogen sót CHECK / server_default | Manual review migration trước khi commit (CLAUDE.md backend đã ghi) |
| SQLite test không hỗ trợ `JSONB` | Dùng `JSON` type (Pydantic + SQLAlchemy 2.0 cross-dialect) — đã ghi trong requirements |
| `secrets.token_urlsafe(48)` + bcrypt cho password — test compute chậm trong CI | Acceptable: 1 lần / new FB user, ~200ms; CI vẫn dưới 5s tổng |

---

## Dependencies

**Backend Python (đã có trong pyproject.toml):**
```
httpx        # đã dùng cho webhook FB graph API call
python-jose  # đã dùng cho JWT
bcrypt       # đã dùng cho password hashing
```

**Mới thêm (chỉ test-only):**
```
respx        # mock httpx async — alternative: monkey-patch httpx.AsyncClient.request
```

**Frontend npm:**
```
# Không cần lib mới — reuse react-router-dom + existing fetch wrapper
```

**Reuse existing:**
- `app/core/security.py::create_access_token` (JWT issue)
- `app/core/security.py::get_password_hash` (bcrypt cho unusable password)
- `app/api/v1/deps.py::get_db` (DB session)
- `app/crud/user.py::get_by_email`, `create` (user upsert path)
- FE `setAuthToken` helper trong `features/auth/auth.api.ts`
- FE i18n pattern + toast component đã có

---

## Out of scope (defer P5B / P6)

- Login bằng FB cho seller/admin role
- Liên kết PSID Messenger ↔ user (P5C qua `messaging_referral` event)
- Lưu FB access_token dài hạn (chỉ dùng 1 lần callback)
- Refresh / re-auth flow
- Logout khỏi FB session
- FB Login JS SDK trên FE (dùng redirect flow đơn giản)
- Account unlink UI
- Multi-FB-account / 1 user
- Email change qua FB sync
- Migrate token-in-URL → HttpOnly cookie (P6 spec riêng)
- Rate limit `/auth/facebook/start` (chưa cần MVP — FB tự rate limit downstream)
- Audit log đăng nhập FB (P7 với security panel)
