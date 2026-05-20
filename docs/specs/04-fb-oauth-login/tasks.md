# Tasks — Feature: Facebook OAuth Login (P5A)

**Tổng thời gian ước tính:** ~7 giờ (1 ngày)
**Status:** ✅ DONE (2026-05-20) — code + tests merged; manual e2e chờ user tạo FB Test User

> **Cách dùng file này:**
> - Tick task khi xong: `- [x] T1 ✅`
> - Mỗi task = 1 commit
> - Task ≤ 30 phút — nếu lớn hơn thì chia nhỏ
> - Conventional Commits, subject ≤ 72 chars

---

## Backend — Config & model

- [x] **T1** ✅ — Thêm `FACEBOOK_APP_ID`, `FACEBOOK_OAUTH_REDIRECT_URI`, `FRONTEND_URL` vào `app/core/config.py` (Pydantic Settings) + `.env.example` (placeholder values) — `1c23568`
- [x] **T2** ✅ — Tạo model `app/models/fb_profile.py`: table `fb_profiles`, columns `id`, `user_id` FK UNIQUE, `fb_app_user_id` UNIQUE, `fb_email`, `fb_first_name`, `fb_last_name`, `fb_profile_pic_url`, `fb_locale`, `raw_oauth_payload` (JSON), `linked_at`, `messenger_psid` UNIQUE nullable (reserved P5C), inherit `TimestampMixin` — `980247c`
- [x] **T3** ✅ — Import `FBProfile` vào `app/models/__init__.py` (yêu cầu cho Alembic autogen + test conftest) — `aeb5efd` + bonus `8687ff7` (register ChatMessage để fix alembic autogen drift)
- [x] **T4** ✅ — Alembic migration `create_fb_profiles`: autogen + manual cleanup (UNIQUE constraints, `JSON` không `JSONB`, `messenger_psid` nullable+UNIQUE). Round-trip upgrade/downgrade verified. — `125a6ea`

## Backend — Schemas, service, CRUD

- [x] **T5** ✅ — Schema `app/schemas/fb_profile.py`: `FBProfileOut` (read with `from_attributes=True`), `FBProfileCreate` (internal-only) — `8db5261`
- [x] **T6** ✅ — CRUD `app/crud/fb_profile.py`: `get_by_fb_app_user_id`, `get_by_user_id`, `create`, `update_oauth_payload` — `9f13798`
- [x] **T7** ✅ — Service `app/services/facebook_oauth_service.py` skeleton: `build_authorize_url(state)`, error helpers, constants — `331b13b`
- [x] **T8** ✅ — Service `exchange_code_for_token(code) -> str`: httpx GET `graph.facebook.com/v19.0/oauth/access_token`, timeout 8s, raise typed exception — `6ec52d4`
- [x] **T9** ✅ — Service `fetch_user_profile(access_token) -> dict`: httpx GET `/me?fields=...`, normalize picture URL — `4529178`
- [x] **T10** ✅ — Service `upsert_user_and_profile(profile) -> User`: by `fb_app_user_id` → refresh; email merge; new user fallback — `436256e`

## Backend — Endpoints

- [x] **T11** ✅ — Router `app/api/v1/auth_facebook.py` + `GET /auth/facebook/start`: state + HttpOnly+SameSite=Lax cookie TTL 600s + 307 dialog redirect — `cd748ad`
- [x] **T12** ✅ — `GET /auth/facebook/callback?code=&state=`: `hmac.compare_digest` state, exchange+fetch+upsert, JWT, 302 `FRONTEND_URL/auth/fb-return?token=` or `?error=` — `fdb5cf6`
- [x] **T13** ✅ — Mount router vào `app/api/v1/__init__.py` (prefix `/v1` đã có ở `api_router`) — `61579c5`. Smoke verified via TestClient: `/start` → 307 facebook.com + cookie set; `/callback` (no params) → 302 FE `?error=invalid_state`.

## Backend — Tests

- [x] **T14** ✅ — `fb_oauth_mocks` fixture trong `tests/conftest.py` patch `exchange_code_for_token` + `fetch_user_profile` via monkeypatch — `b6723c1`
- [x] **T15** ✅ — `test_facebook_start_redirects_to_fb` + `test_facebook_start_state_cookie_is_httponly_lax` — pending commit
- [x] **T16** ✅ — `test_facebook_callback_new_user_happy` + `test_facebook_callback_duplicate_fb_app_user_id` (idempotent: same FB id → no duplicate user/profile, fields refreshed) — pending commit. Bonus `8e03b7b` fix SimpleNamespace scoping in fixture.
- [x] **T17** ✅ — `test_facebook_callback_email_merge` — existing email/password user, FB login same email → link, no 2nd user, password hash untouched — pending commit
- [x] **T18** ✅ — `test_facebook_callback_no_email_granted` — FB không trả email → user.email = `fb_<id>@dhtc.local`, FBProfile.fb_email vẫn NULL (honest) — pending commit
- [x] **T19** ✅ — error paths: `invalid_state` (state tampering), `fb_unavailable` (Graph 500), `user_cancelled` (bonus, FB redirect with `error_reason=user_denied`) — pending commit. **Full suite: 74 pass / 1 pre-existing fail unrelated to P5A (`test_cancel_order_restores_stock` — SQLite `now()` server_default issue, P4 tech debt).**

## Frontend — Button + return route

- [x] **T20** ✅ — `FacebookLoginButton.tsx` — FB-blue pill button, inline SVG "f" icon, click → `window.location.href = '/api/v1/auth/facebook/start'`. Note: chọn FB brand blue `#1877F2` thay vì green để user recognize Facebook flow ngay. — pending commit
- [x] **T21** ✅ — Wired vào `Login.tsx` + `Register.tsx` (dưới form, divider "hoặc", custom label cho Register "Đăng ký bằng Facebook") — pending commit
- [x] **T22** ✅ — `FacebookReturnPage.tsx`: token path → `sessionStorage.access_token` + invalidate `authKeys.me` + navigate `/` replace; error path → VN error card với mapping `invalid_state`/`user_cancelled`/`fb_unavailable` + nút "Quay lại đăng nhập" — pending commit
- [x] **T23** ✅ — Route `/auth/fb-return` registered trong `App.tsx` (public, ngoài `ProtectedRoute`) — pending commit

## Frontend — Tests

- [x] **T24** ✅ — Button tests: default label, click → `window.location.href = /api/v1/auth/facebook/start`, disabled blocks navigation — pending commit
- [x] **T25** ✅ — `/auth/fb-return?token=...` happy: token persisted to `sessionStorage.access_token` + navigated to `/` via replace — pending commit
- [x] **T26** ✅ — `/auth/fb-return?error=...` paths: `invalid_state` (VN msg + back link), `user_cancelled` (VN msg), unknown code (fallback shows raw code). Bonus: assert token NOT persisted on error — pending commit. **All 3 in one commit** (single file, tightly coupled).

  **Full FE suite: 70/70 pass.**

## Integration & handoff

- [x] **T27** ✅ — Manual e2e smoke checklist trong `docs/specs/04-fb-oauth-login/handoff.md`: TL;DR + user-action items (FB App + Test User + .env) + 6 manual flows (pre-flight/happy/re-login/email merge/cancel/tamper/server-side grep) + Findings placeholder + Files-touched table — `a398682`
- [x] **T28** ✅ — Top-level `handoff.md` updated: TL;DR ticks P5A ✅, new session log entry với 30-task commit list, carry-over tech debt, known limitation token-in-URL → P6, reserved messenger_psid cho P5C — `4eb1678`
- [x] **T29** ✅ — `uv run ruff check app/` clean; `uv run mypy app` clean cho P5A files (3 nits fixed: dict[str, Any] annotations + rename `user` → `existing_user`); `npm run typecheck` clean (1 unused `vi` import removed); `npm run build` ✅ pass — `7139168`
- [x] **T30** ✅ — `tasks.md` 100% ticked; status = ✅ DONE — pending this commit

---

## Tổng kết

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 30 | **30 ✅** (T1–T30) |
| Tests | 8 BE + 3 FE = 11 | **9 BE + 7 FE = 16** (BE: 2 /start + 5 /callback paths + 2 error variants; FE: 3 button + 1 token-happy + 3 error paths) |
| Files mới (BE) | 6 | **7** (config edit + model + schema + CRUD + service + router + tests/conftest fixture + tests file) |
| Files mới (FE) | 3 | **3** (FacebookLoginButton + FacebookReturnPage + test file) |
| Files edit | ~5 | **6** (`config.py`, `.env.example`, `models/__init__.py`, `api/v1/__init__.py`, `Login.tsx`, `Register.tsx`, `App.tsx`) |
| Suite status | — | BE **74/75** (1 pre-existing fail unrelated — `test_cancel_order_restores_stock` SQLite `now()`); FE **70/70**; ruff clean; mypy clean cho P5A files; typecheck clean; build pass |
| Thời gian | ~7h | _xấp xỉ_ — chia làm 2 phiên (compaction giữa T13 và T14) |

**Known limitation (defer P6):** Token qua URL query `?token=<jwt>` ở redirect cuối — FE replace-navigate clear history, nhưng vẫn có risk leak qua Referer. P6 thay bằng HttpOnly cookie + `/auth/me` bootstrap hoặc one-shot code exchange.

**Reserved cho P5C:** `fb_profiles.messenger_psid` UNIQUE nullable — webhook P5C sẽ ánh xạ Messenger sender_id → user sau khi user FB-login web.
