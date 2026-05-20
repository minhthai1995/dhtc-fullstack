# Tasks — Feature: Facebook OAuth Login (P5A)

**Tổng thời gian ước tính:** ~7 giờ (1 ngày)
**Status:** 📝 Drafting

> **Cách dùng file này:**
> - Tick task khi xong: `- [x] T1 ✅`
> - Mỗi task = 1 commit
> - Task ≤ 30 phút — nếu lớn hơn thì chia nhỏ
> - Conventional Commits, subject ≤ 72 chars

---

## Backend — Config & model

- [ ] **T1** — Thêm `FACEBOOK_APP_ID`, `FACEBOOK_OAUTH_REDIRECT_URI`, `FRONTEND_URL` vào `app/core/config.py` (Pydantic Settings) + `.env.example` (placeholder values)
  - Commit: `chore(backend): add FB OAuth env keys to config + .env.example`
- [ ] **T2** — Tạo model `app/models/fb_profile.py`: table `fb_profiles`, columns `id`, `user_id` FK UNIQUE, `fb_app_user_id` UNIQUE, `fb_email`, `fb_first_name`, `fb_last_name`, `fb_profile_pic_url`, `fb_locale`, `raw_oauth_payload` (JSON), `linked_at`, `messenger_psid` UNIQUE nullable (reserved P5C), inherit `TimestampMixin`
  - Commit: `feat(backend): add FBProfile model with reserved messenger_psid column`
- [ ] **T3** — Import `FBProfile` vào `app/models/__init__.py` (yêu cầu cho Alembic autogen + test conftest)
  - Commit: `chore(backend): register FBProfile in models __init__`
- [ ] **T4** — Alembic migration `create_fb_profiles`: `uv run alembic revision --autogenerate -m "create fb_profiles"` → manual review (UNIQUE constraints, `JSON` không `JSONB`, `messenger_psid` nullable+UNIQUE)
  - Commit: `feat(backend): alembic migration create fb_profiles table`

## Backend — Schemas, service, CRUD

- [ ] **T5** — Schema `app/schemas/fb_profile.py`: `FBProfileOut` (read with `from_attributes=True`), `FBProfileCreate` (internal-only)
  - Commit: `feat(backend): add FBProfile pydantic schemas`
- [ ] **T6** — CRUD `app/crud/fb_profile.py`: `get_by_fb_app_user_id`, `get_by_user_id`, `create`, `update_oauth_payload`
  - Commit: `feat(backend): add fb_profile CRUD operations`
- [ ] **T7** — Service `app/services/facebook_oauth_service.py` skeleton: `build_authorize_url(state)`, error helpers, constants (FB_DIALOG_URL, GRAPH_BASE, SCOPES, FIELDS)
  - Commit: `feat(backend): facebook_oauth_service skeleton + authorize URL builder`
- [ ] **T8** — Service `exchange_code_for_token(code) -> str`: httpx POST `graph.facebook.com/v19.0/oauth/access_token`, timeout 8s, raise typed exception on FB error payload
  - Commit: `feat(backend): FB OAuth code-to-token exchange`
- [ ] **T9** — Service `fetch_user_profile(access_token) -> dict`: httpx GET `/me?fields=id,email,first_name,last_name,picture.width(400).height(400)`, normalize picture URL
  - Commit: `feat(backend): FB Graph /me profile fetch`
- [ ] **T10** — Service `upsert_user_and_profile(payload) -> User`: email merge nếu trùng, tạo user mới với `secrets.token_urlsafe(48)` + bcrypt nếu không, link/upsert FBProfile (idempotent on `fb_app_user_id`)
  - Commit: `feat(backend): FB OAuth user upsert with email merge`

## Backend — Endpoints

- [ ] **T11** — Router `app/api/v1/auth_facebook.py` + endpoint `GET /auth/facebook/start`: sinh state `secrets.token_urlsafe(32)`, set HttpOnly+Secure+SameSite=Lax cookie TTL 600s, 307 redirect dialog URL
  - Commit: `feat(backend): GET /auth/facebook/start with CSRF state cookie`
- [ ] **T12** — Endpoint `GET /auth/facebook/callback?code=&state=`: verify state cookie `hmac.compare_digest`, gọi service exchange + fetch + upsert, issue JWT, 302 `FRONTEND_URL/auth/fb-return?token=<jwt>`; error path → `?error=<vi_code>`
  - Commit: `feat(backend): GET /auth/facebook/callback issues JWT and redirects FE`
- [ ] **T13** — Mount router vào `app/main.py` (prefix `/api/v1`)
  - Commit: `chore(backend): mount auth_facebook router`

## Backend — Tests

- [ ] **T14** — pytest fixtures `tests/conftest.py`: `fb_oauth_mocks` helper mock httpx responses cho /token + /me (dùng `monkeypatch` hoặc `respx`)
  - Commit: `test(backend): fb_oauth_mocks fixture for httpx mocking`
- [ ] **T15** — `tests/test_auth_facebook.py`: `test_facebook_start_redirects_to_fb` + `test_facebook_start_state_cookie_is_httponly_lax`
  - Commit: `test(backend): /auth/facebook/start redirect + cookie attrs`
- [ ] **T16** — `tests/test_auth_facebook.py`: `test_facebook_callback_new_user_happy` + `test_facebook_callback_duplicate_fb_app_user_id` (idempotent re-login)
  - Commit: `test(backend): /auth/facebook/callback new user + idempotent re-login`
- [ ] **T17** — `tests/test_auth_facebook.py`: `test_facebook_callback_email_merge` (existing user same email → link, không tạo user thứ 2)
  - Commit: `test(backend): /auth/facebook/callback email merge path`
- [ ] **T18** — `tests/test_auth_facebook.py`: `test_facebook_callback_no_email_granted` (FB không trả email → synthetic `fb_<id>@dhtc.local`, `fb_email=null`)
  - Commit: `test(backend): /auth/facebook/callback no-email synthetic user`
- [ ] **T19** — `tests/test_auth_facebook.py`: `test_facebook_callback_invalid_state` + `test_facebook_callback_fb_api_error` (error path → 302 với `?error=...`)
  - Commit: `test(backend): /auth/facebook/callback error paths (invalid state, fb api error)`

## Frontend — Button + return route

- [ ] **T20** — Component `frontend/src/features/auth/FacebookLoginButton.tsx` (style green, FB SVG icon inline, full-width mobile, `onClick → window.location.href = '/api/v1/auth/facebook/start'`)
  - Commit: `feat(frontend): FacebookLoginButton component`
- [ ] **T21** — Add `<FacebookLoginButton />` vào `LoginPage.tsx` + `RegisterPage.tsx` (dưới form, divider "hoặc")
  - Commit: `feat(frontend): wire FB login button into Login + Register pages`
- [ ] **T22** — Page `frontend/src/pages/auth/FacebookReturnPage.tsx`: `useSearchParams` đọc `token` | `error`, success path `setAuthToken` + navigate `/`, error path toast VI + nút quay lại login
  - Commit: `feat(frontend): /auth/fb-return page handles token/error from BE`
- [ ] **T23** — Route mới `/auth/fb-return` trong router config (`App.tsx` hoặc `frontend/src/routes.tsx`)
  - Commit: `feat(frontend): register /auth/fb-return route`

## Frontend — Tests

- [ ] **T24** — `frontend/tests/auth/FacebookLogin.test.tsx`: render button trong `LoginPage` + click → `window.location.href` set đúng
  - Commit: `test(frontend): FacebookLoginButton renders and triggers redirect`
- [ ] **T25** — `frontend/tests/auth/FacebookLogin.test.tsx`: `/auth/fb-return?token=...` happy path (call `setAuthToken` + navigate `/`)
  - Commit: `test(frontend): /auth/fb-return token path`
- [ ] **T26** — `frontend/tests/auth/FacebookLogin.test.tsx`: `/auth/fb-return?error=invalid_state` render toast VI + nút back
  - Commit: `test(frontend): /auth/fb-return error path`

## Integration & handoff

- [ ] **T27** — Manual e2e smoke checklist trong `docs/specs/04-fb-oauth-login/handoff.md`: tạo FB test user → login flow đầy đủ → DB verify (steps 1-6 từ plan Phase 3)
  - Commit: `docs(P5A): handoff manual e2e smoke checklist`
- [ ] **T28** — Update top-level `handoff.md` TL;DR: P5A done, known limitation token-in-URL → P6, `fb_profiles.messenger_psid` ready cho P5C
  - Commit: `docs: update handoff TL;DR after P5A done`
- [ ] **T29** — Run `uv run ruff check .` + `uv run mypy app` + `npm run typecheck && npm run build` → all clean
  - Commit: nếu cần fix lint/type — `chore: fix lint+type after P5A`
- [ ] **T30** — Tick `tasks.md` 100% + update checklist.md nếu có
  - Commit: `docs(P5A): tick tasks.md 100%`

---

## Tổng kết (sẽ điền sau khi xong)

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 30 | _TBD_ |
| Tests | 8 BE + 3 FE = 11 | _TBD_ |
| Files mới (BE) | 6 (config edit + model + schema + CRUD + service + router + test) | _TBD_ |
| Files mới (FE) | 3 (button + return page + test) | _TBD_ |
| Files edit | ~5 (config.py, .env.example, models/__init__.py, main.py, LoginPage, RegisterPage, App.tsx) | _TBD_ |
| Thời gian | ~7h | _TBD_ |
