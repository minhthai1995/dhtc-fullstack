# Handoff — fullstack-template

> **Đọc TL;DR bên dưới trước khi làm bất cứ điều gì. Phần session log đóng mặc định — Claude không tự mở.**

---

## TL;DR (đọc đầu phiên mới — ≤ 30 dòng)

- **Đây là:** DHTC marketplace fullstack (Đà Nẵng truyền thống) — đã rời template, đang build feature thật
- **Đã có:** Auth ✅ · Admin/Seller/Customer portals ✅ · Chatbot Messenger ✅ · CRM admin 4-tab ✅ · Page tracking P2 ✅ · Product image upload P3 ✅ · Facebook OAuth login P5A ✅ · **P4A DB foundation ✅ 13/13** (ChatMessage +7 cột P5C-ready · customer_clusters + members + 7 system-slug seed P5D-ready · suite 77/77 · ruff 0)
- **Vừa xong (2026-05-25):** P4A T7–T13 — customer_cluster schema + CRUD + tests + ruff cleanup (29→0) + spec ticked 100%
  - BE models: `app/models/customer_cluster.py` — `CustomerCluster` (slug UNIQUE, criteria_json JSON, is_system/is_active Boolean với portable `server_default="true"/"false"`) + `CustomerClusterMember` (user_id+cluster_id FK CASCADE, UNIQUE composite, score Float, signals_json JSON, assigned_at func.now()); registered in `models/__init__.py` (`1a50b89` + `abfc168`)
  - BE migration `6a06c8b` `create_customer_clusters` — autogen + manual `op.bulk_insert` 7 system clusters trong `upgrade()`; `op.execute("DELETE FROM customer_clusters WHERE is_system = true")` trong `downgrade()`; round-trip clean
  - BE CRUD `app/crud/customer_cluster.py` (`aee76f6`) — `get_by_slug` · `list_active` · `assign_user` idempotent (PG `ON CONFLICT DO UPDATE constraint=...` ngắn gọn, SQLite SELECT→UPDATE/INSERT fallback) · `list_for_user` sort by id
  - Tests `tests/test_customer_clusters.py` (`b888db3`, 5 cases): autouse fixture `PRAGMA foreign_keys=ON` cho SQLite; seed=7 slugs khớp spec contract; UNIQUE conflict → 1 row score refreshed; CASCADE delete user → members gone (dùng raw SQL `text("DELETE FROM users WHERE id = :uid")` để bypass ORM cascade); `list_for_user` sort
  - Ruff cleanup (`3311bae`): autofix sweep + manual wrap 29 E501 trên 5 file (4 migrations cũ + test_admin.py:65 tuple); quyết định KHÔNG dùng `ruff format` (16-file blast radius); 15 migration importlib roundtrip xác nhận import-clean; pytest 77/77 PASS không regression
  - Spec `docs/specs/05-db-foundation/` (this commit): 13/13 ticked với SHA; Tổng kết table filled; requirements/design/tasks header → ✅ Implemented
- **Vừa xong (2026-05-20):** Feature P5A Facebook OAuth login (spec 30 task → BE 9/9 + FE 70/70 + type-check clean)
  - BE: `app/services/facebook_oauth_service.py` (build_authorize_url + exchange_code_for_token + fetch_user_profile + upsert_user_and_profile), `app/api/v1/auth_facebook.py` (`GET /auth/facebook/start` CSRF state HttpOnly+SameSite=Lax cookie TTL 600s → 307 dialog; `GET /auth/facebook/callback?code=&state=` hmac.compare_digest + exchange+fetch+upsert + 302 `FRONTEND_URL/auth/fb-return?token=` hoặc `?error=`), `models/fb_profile.py` table `fb_profiles` UNIQUE(user_id, fb_app_user_id, messenger_psid nullable reserved P5C), Alembic `125a6ea`
  - BE policy: email merge auto-link FBProfile vào user email/password đã tồn tại (password hash giữ nguyên); no-email synthetic `fb_<id>@dhtc.local` + random unusable password `secrets.token_urlsafe(48)`
  - FE: `<FacebookLoginButton>` brand `#1877F2` pill `→ window.location.href = '/api/v1/auth/facebook/start'`, wired Login + Register dưới form với divider "hoặc"; `/auth/fb-return` page persist `sessionStorage.access_token` + invalidate `authKeys.me` + `navigate('/', replace)` cho token path, VN error card + back link cho error path (`invalid_state` / `user_cancelled` / `fb_unavailable` / fallback)
  - Tests: 9 pytest BE (start redirect + cookie attrs · happy new user · idempotent re-login · email merge · no-email synthetic · invalid_state · fb_unavailable · user_cancelled), 7 vitest FE (button label/click/disabled · token persist+navigate · 3 error paths + token-not-persisted assertion); full BE suite 74/75 (1 pre-existing test_orders fail unrelated), FE 70/70
  - Known limitation P6: token qua URL query `?token=<jwt>` ở redirect cuối — mitigation hiện tại FE replace-navigate clear ngay; P6 sẽ thay bằng HttpOnly cookie + `/auth/me` bootstrap hoặc one-shot code exchange
  - Reserved cho P5C: `fb_profiles.messenger_psid` UNIQUE nullable — P5C webhook map sender_id → user khi chat sau khi FB-login web
  - Spec: `docs/specs/04-fb-oauth-login/{spec,design,plan,tasks,handoff}.md` — 30 task ticked đầy đủ, handoff.md có user-action checklist tạo FB App + 6 manual e2e flows
- **Branch:** `main` — latest commit (T13 this commit); working tree clean sau P4A 13/13
- **Blocked:** Manual e2e P5A với FB Test User chờ user tạo FB App + điền `.env` (xem `docs/specs/04-fb-oauth-login/handoff.md`)
- **Files đang sửa:** _(không)_
- **Next session:** P5B Messenger Customer Chat Plugin embed; P5C capture-everything Messenger webhook → `fb_profiles.messenger_psid` + JOIN `chat_messages.linked_user_id` vào AdminCRM CustomersTab; P5D multi-signal clustering áp `customer_cluster_members` runtime (segment derive → assign); P5E proactive reply check-in posts; P6 AWS deploy. Carry-over: S3 migration cho production uploads; Response time / conversion compute cho ConversationsTab; Redis rate limit; GeoIP country_code thật

---

## Active context

→ **P4A ✅ done 2026-05-25:** Suite **77/77** PASS · ruff 0 errors · 13/13 task ticked với SHA · spec status ✅ Implemented. Schema P5C-ready (`chat_messages` +7 cột capture/linked) và P5D-ready (`customer_clusters` 7 system slugs + `customer_cluster_members` UNIQUE composite + CRUD `assign_user` idempotent). Spec ở `docs/specs/05-db-foundation/`.

---

## Session log

<details>
<summary>2026-05-21 → 2026-05-25 · P4A DB foundation (T1–T13) — SQLite portability + ChatMessage P5C + customer_clusters P5D + ruff 29→0</summary>

**Làm gì:**
- **Phase 1 — SQLite portability fix (T1–T3):** Fix `notification.py:42` `server_default="now()"` → `func.now()` (root cause: SQLite literal-quotes string → kén kiểu DateTime); `tests/test_db_portability.py` smoke insert all server_default datetime tables qua raw SQL → assert `isinstance(row.created_at, datetime)`; verify full backend 77/77 (1 pre-existing fail giờ pass)
- **Phase 2 — Extend ChatMessage cho P5C (T4–T6):** `app/models/chat_message.py` thêm 7 cột nullable (`intent_cluster` · `captured_phone/email/address` · `linked_user_id` FK SET NULL · `referenced_product_id` FK SET NULL · `referenced_order_id` FK SET NULL) + 3 indexes; Alembic `c64c765` `extend_chat_messages_p5c` round-trip clean; tests insert all 7 + FK SET NULL behavior + index existence
- **Phase 3 — Customer clusters cho P5D (T7–T11):** `app/models/customer_cluster.py` 2 model (CustomerCluster slug UNIQUE + criteria_json JSON + is_system/is_active Boolean portable `server_default="true"/"false"`; CustomerClusterMember user+cluster FK CASCADE + UNIQUE composite + score Float + signals_json + assigned_at func.now()); register `models/__init__.py`; migration `6a06c8b` autogen + `op.bulk_insert` 7 system clusters (`messenger_engaged` · `web_only_visitor` · `lead_no_purchase` · `first_buyer` · `repeat_buyer` · `lapsed_60d` · `high_value_vn`); CRUD `app/crud/customer_cluster.py` 4 helper: `get_by_slug` · `list_active` · `assign_user` idempotent (PG `pg_insert.on_conflict_do_update(constraint=...)`, SQLite SELECT→UPDATE/INSERT fallback qua `_is_postgres(db)` dialect check) · `list_for_user` sort by id; tests 5 case với autouse SQLite `PRAGMA foreign_keys=ON` (seed=7 + slugs khớp spec contract + UNIQUE conflict refresh + CASCADE qua raw SQL bypass ORM + list_for_user order)
- **Phase 4 — Ruff cleanup (T12):** `ruff check . --fix` autofix sweep; manual wrap 29 E501 trên 5 file (4 migrations cũ với FK constraint name dài + Enum multi-value + `op.create_index` + tuple wrap test_admin.py:65); quyết định KHÔNG `ruff format` (16-file blast radius); verify 0 errors + importlib roundtrip 15 migration import-clean + pytest 77/77 không regression
- **T13 spec close:** tick `tasks.md` T1–T13 với SHA + fill Tổng kết table với số liệu thực tế (3 test file mới / 11 case · 7 file mới · 8 file edit · 2 migration · ~5h thực tế); requirements.md + design.md + tasks.md header → ✅ Implemented

**Commits chính:** `3dfa0b6` (T1 notif func.now) → `2ad708a` (T2 portability test) → `c6535d7` (T3 verify 77/77) → `bd704e8` (T4 ChatMessage +7) → `c64c765` (T5 migration extend_chat_messages_p5c) → `4e53a1c` (T6 tests p5c FK SET NULL) → `f50ff29` (T1–T6 ticked) → `1a50b89` (T7 cluster models) → `abfc168` (T8 register) → `6a06c8b` (T9 migration + 7 seed) → `aee76f6` (T10 CRUD idempotent PG/SQLite) → `b888db3` (T11 tests CASCADE + UNIQUE) → `3311bae` (T12 ruff 29→0)

**Carry-over tech debt:**
- `customer_cluster_members.assigned_at` chưa có `on_update=func.now()` — P5D `assign_user` refresh path đã set thủ công, nhưng nếu bulk update outside CRUD thì không tự refresh — review nếu cần
- 7 system slugs hardcoded ở `migration upgrade()` + `tests/test_customer_clusters.py EXPECTED_SYSTEM_SLUGS` — single source of truth nên move vào `app/core/constants.py` SYSTEM_CLUSTER_SLUGS khi P5D dùng runtime (lúc đó CRUD `assign_user` cần lookup by slug → cluster_id)
- Migration filename `2026_MM_DD_HHMM_*.py` không importable as Python module (starts with digits) → tests phải hardcode 7 slug constant, không thể `from ... import SYSTEM_CLUSTERS`
- `_classify_intent` ở P5C CRM endpoints chạy on-the-fly mỗi request — chưa persist vào `chat_messages.intent_cluster` cột mới; P5D nên backfill batch job + write-through ở webhook ingest

</details>

<details>
<summary>2026-05-20 · P5A Facebook OAuth login — FB App OAuth + email merge + sessionStorage (T1–T30)</summary>

**Làm gì:**
- BE config: `FACEBOOK_APP_ID + FACEBOOK_APP_SECRET + FACEBOOK_OAUTH_REDIRECT_URI + FRONTEND_URL` trong `app/core/config.py` Pydantic Settings + `.env.example` placeholder (secret KHÔNG commit)
- BE model: `models/fb_profile.py` table `fb_profiles` (user_id FK UNIQUE, fb_app_user_id UNIQUE, fb_email/first_name/last_name/profile_pic_url/locale, raw_oauth_payload JSON, linked_at, messenger_psid UNIQUE nullable reserved P5C); Alembic `125a6ea` round-trip verified
- BE service `app/services/facebook_oauth_service.py`: `build_authorize_url(state)` v19.0 dialog với scope=`email,public_profile`; `exchange_code_for_token(code)` httpx GET `graph.facebook.com/v19.0/oauth/access_token` timeout 8s + typed `FacebookOAuthError`; `fetch_user_profile(token)` httpx GET `/me?fields=id,email,first_name,last_name,picture.type(large),locale` normalize picture URL; `upsert_user_and_profile(profile)` by fb_app_user_id → refresh; email merge auto-link FBProfile vào user đã có; no-email fallback synthetic `fb_<id>@dhtc.local` + random unusable password `secrets.token_urlsafe(48)`
- BE router `app/api/v1/auth_facebook.py`: `GET /auth/facebook/start` → 307 dialog + `Set-Cookie: fb_oauth_state=<secrets.token_urlsafe(32)>; HttpOnly; SameSite=Lax; Max-Age=600`; `GET /auth/facebook/callback?code=&state=` → `hmac.compare_digest(state_query, state_cookie)` → exchange+fetch+upsert → JWT → 302 `FRONTEND_URL/auth/fb-return?token=<jwt>` hoặc `?error=invalid_state|user_cancelled|fb_unavailable`; mount vào `api/v1/__init__.py`
- BE tests: 9 pytest `tests/test_auth_facebook.py` + `fb_oauth_mocks` fixture (monkeypatch service layer thay vì respx — clean hơn cho async helpers) — happy/idempotent/email merge/no-email/invalid_state/fb_unavailable/user_cancelled/start redirect/cookie attrs; full suite 74/75 (1 pre-existing `test_cancel_order_restores_stock` SQLite `now()` isoformat — không liên quan P5A)
- FE button `features/auth/FacebookLoginButton.tsx`: brand `#1877F2` pill + inline SVG "f" icon + `window.location.href = '/api/v1/auth/facebook/start'`; wired vào `Login.tsx` + `Register.tsx` dưới submit button với divider "hoặc" (Register label "Đăng ký bằng Facebook")
- FE return page `pages/auth/FacebookReturnPage.tsx`: useEffect đọc `?token=` → `sessionStorage.setItem('access_token', …)` + `queryClient.invalidateQueries({ queryKey: authKeys.me })` + `navigate('/', { replace: true })` (clear URL khỏi history để token không leak qua Referer); `?error=` → VN error card với `ERROR_MESSAGES` mapping + "Quay lại đăng nhập" link; route `/auth/fb-return` registered trong `App.tsx` ngoài ProtectedRoute
- FE tests: 7 vitest `tests/auth/FacebookLogin.test.tsx` — button default label + click → href + disabled blocks; token persist `sessionStorage` + navigate "/" rendered "HOME" via `MemoryRouter initialEntries`; 3 error paths (invalid_state VN + back link + token NOT persisted assertion, user_cancelled, unknown code fallback); FE suite 70/70
- Spec: `docs/specs/04-fb-oauth-login/{spec,design,plan,tasks,handoff}.md` — 30 task ticked đầy đủ với SHA; `handoff.md` chứa TL;DR + user-action checklist (tạo FB App → test user → copy App ID+Secret → set redirect URI → điền `.env`) + known limitation token-in-URL → P6 + reserved messenger_psid P5C + 6 manual e2e flows (pre-flight/happy/re-login/email merge/cancel/tamper/server-side grep check)

**Commits chính:** `1c23568` (T1 config) → `980247c` (T2 model) → `aeb5efd`+`8687ff7` (T3 registry+ChatMessage fix) → `125a6ea` (T4 migration) → `8db5261` (T5 schema) → `9f13798` (T6 CRUD) → `331b13b`–`436256e` (T7–T10 service) → `cd748ad` (T11 /start) → `fdb5cf6` (T12 /callback) → `61579c5` (T13 mount) → `b6723c1` (T14 fixture) → `1fbbd54` (T15) → `8e03b7b` (SimpleNamespace fix) → `24013f0` (T16) → `dcca9d4` (T17 email merge) → `de4a46c` (T18 no-email) → `3356224` (T19 error paths) → `489173c` (T20 button) → `ceb915d` (T21 wire) → `a65ae78` (T22 return page) → `46f38a3` (T23 route) → `d64be1f` (T24–T26 FE tests) → `a398682` (T27 handoff doc)

**Carry-over tech debt:**
- Token qua URL query string ở redirect cuối — defer P6 (HttpOnly cookie + `/auth/me` bootstrap hoặc one-shot code exchange `POST /auth/fb-exchange`)
- Manual e2e với FB Test User chờ user tạo FB App + điền `.env` — checklist trong `docs/specs/04-fb-oauth-login/handoff.md`
- `fb_profiles.messenger_psid` UNIQUE nullable reserved cho P5C — webhook ánh xạ Messenger sender_id → user sau khi user FB-login web
- Pre-existing `tests/test_orders.py::test_cancel_order_restores_stock` SQLite `'now()'` server_default — P4A tech debt
- Backend `ruff check .` chưa run final sweep — backlog cleanup F401/F811/E501

</details>

<details>
<summary>2026-05-20 · P3 Product image upload — local disk → 4 WebP sizes + UI thân thiện (T1–T32)</summary>

**Làm gì:**
- BE deps: `Pillow 12.2.0 + pillow-heif 1.3.0` (iPhone HEIC decode qua `register_heif_opener()`)
- BE config: `UPLOAD_DIR` (Path) + `MAX_UPLOAD_BYTES = 2 * 1024 * 1024` trong `app/core/config.py` + `.env.example`; gitignore `backend/uploads/`
- BE schema: `app/schemas/product_image.py` (ProductImageOut/Urls/In với 4 size keys)
- BE service: `app/services/image_service.py` — `process_upload()` validate MIME + size + Pillow `verify()` + `ImageOps.exif_transpose()` rotation + `Image.MAX_IMAGE_PIXELS = 50_000_000` anti-bomb + resize 4 size qua `ImageOps.contain` + save WebP quality=85 method=6 (chậm hơn nhưng nhỏ hơn ~15%); `delete_image()` idempotent + `Path.resolve()` parent check chặn path traversal
- BE endpoints: `app/api/v1/products.py` mới — `POST /products/images` (require_seller_or_admin dep) + `DELETE /products/images/{image_id}`, `main.py` mount `StaticFiles` `/uploads`
- BE tests: 8 pytest (happy/401/oversized monkeypatch=500B/invalid-MIME PDF/malformed JPEG bytes/delete-idempotent 204×2/path-traversal `..%2Fescape`/EXIF orientation=6 → portrait); fixture `make_test_image(size, exif)` trong `conftest.py`
- FE types: `features/products/types.ts` ProductImage + LegacyProductImage + `imageThumbUrl()` helper; `productImages.api.ts` `uploadProductImage(file, onProgress)` + `deleteProductImage(id)`
- FE component: `features/products/ImageUploader.tsx` — dropzone + click-to-pick (hidden input) + grid preview (3-5 col responsive) + URL.createObjectURL cleanup on unmount + multi-upload parallel với axios onUploadProgress per tile + maybeCompress() gate 1.5MB → `browser-image-compression` WebWorker maxSizeMB=1.8 / maxWidthOrHeight=1920 → fallback nguyên gốc nếu compress fail + native HTML5 drag-drop reorder (draggable + dragSrc state + setData required for Firefox) + remove uploaded + cancel pending + toast VN errors (MIME extension fallback cho mobile picker empty content_type + 10MB hard limit + slots-overflow info-toast)
- FE integrate: `SellerProductEdit.tsx` thay `<input type="url">` bằng `<ImageUploader>`, `toProductImages()` normalize legacy `{url}` rows; `ProductCard.tsx` + `Shop.tsx` thumbnails dùng `productImageSrc()` helper prefer `urls.medium`
- FE tests: `tests/products/ImageUploader.test.tsx` 7 vitest (render empty dropzone + MAX_IMAGES guard + PDF rejection + primary-badge single + compress-skip <1.5MB + compress-trigger >1.5MB với mock browser-image-compression + reorder dragStart→drop với mock dataTransfer)
- E2E: `e2e/seller.spec.ts` thêm test thứ 9 — setInputFiles với fixture JPEG inline base64 (1×1) → đợi `img[src*="/uploads/products/"]` xuất hiện → assert "Ảnh chính" badge
- Spec: `docs/specs/03-product-image-upload/{spec,design,tasks}.md` — 32 task ticked đầy đủ với commit SHA

**Commits chính:** `dd4c1c0` (T1–T9 BE setup→service→endpoint) → `ccede18` (T14) → `8388fb5` (T15) → `2accb33`–`6201445` (T16–T22 FE deps→component) → `c6eab08` (T23) → `9d3b36b` (T24) → `7bdeefe` (T25+T26 integrate+legacy compat) → `35b3851` (T27 thumbnails) → `3d6e578` (T28) → `1c5b216` (T29) → `ff4347e` (T30 e2e)

**Carry-over tech debt:**
- Local disk storage MVP — production cần migrate sang S3/R2 (P4): mỗi tile sau khi process upload S3 thay vì lưu `backend/uploads/products/{id}/{size}.webp`
- `Image.MAX_IMAGE_PIXELS = 50_000_000` (50MP) đủ chặn ZIP bomb thông thường nhưng iPhone 16 Pro Max 48MP cận sát ngưỡng — review nếu seller phàn nàn
- WebP quality fixed = 85; chưa expose dynamic quality theo file type (PNG transparent có thể cần lossless)
- `product.images` vẫn là `list[dict]` flexible — không strict shape; consider migrate sang JSONB column với Pydantic validation khi data nhiều
- EXIF GPS / camera maker chưa strip — chỉ rotate; risk lộ vị trí khi seller upload từ điện thoại (P4 privacy hardening: `image.info` purge)

</details>

<details>
<summary>2026-05-20 · P2 Page tracking — pixel + behavior tab data thật (T1–T22)</summary>

**Làm gì:**
- BE models: `app/models/page_view.py` (5 indexes — viewed_at, visitor_id, session_id, user_id, composite viewed_at+path) + Alembic migration `c3d4e5f6a7b8`
- BE pipeline: `app/schemas/tracking.py` (PageViewIn 8-36 char ids) · `app/crud/page_view.py` · `app/services/tracking.py` (derive_device/source/country_code) · `app/core/rate_limit.py` (sliding-window deque, 60/min)
- BE endpoint: `POST /api/v1/tracking/page-view` optional Bearer auth, CF-IPCountry passthrough
- BE admin behavior: `app/schemas/admin_behavior.py` + `GET /admin/behavior/overview` (stats/by_device/by_source/top_pages/hourly_24h/funnel) + `/sessions` paginated — Python in-memory aggregation cho SQLite portability
- FE tracking: `features/tracking/{visitor,tracking.api,useTracking}.ts` — fetch keepalive bypass axios 401 redirect; wired vào CustomerLayout only (admin/seller untracked)
- FE BehaviorTab rebind: KPI thật (sessions, pageviews, bounce, avg duration) + ThinBar device/source/top_pages + funnel real counts + HourlyBarChart real data + sessions table
- Tests: 4 pytest tracking + 4 pytest admin behavior + 5 vitest visitor + 2 Playwright e2e (Hành vi real-data + KPI numeric)
- Spec: `docs/specs/02-page-tracking/{spec,design,plan,tasks}.md` — full 24-task spec, T1–T22 ticked (T23 = this entry)

**Commits chính:** `cd22647` (PageView model) → `9480096` (migration) → `a747650`-`d7d9b8f` (T3–T7 tracking endpoint) → `be10ce8` (T12 tests) → `a244496`-`6d18682` (T8–T11, T13 admin behavior) → `07b493c`-`5c95766` (T14–T17 FE tracking client) → `1dbfe59` (T18 vitest) → `3d0a4c0`-`c5915cf` (T19–T20 API + hook) → `c71803e` (T21 BehaviorTab) → `33e2532` (T22 e2e)

**Carry-over tech debt:**
- Rate limit in-memory deque single-process (P3: switch sang Redis ZRANGEBYSCORE)
- country_code chỉ derive khi reverse proxy gắn `CF-IPCountry` header (P3: tích hợp MaxMind/GeoLite2)
- Bounce-rate compute định nghĩa "session = 1 pageview"; thêm dwell-time threshold sau khi có client-side beacon

</details>

<details>
<summary>2026-05-20 · CRM admin restructure 4 tab khớp mockup + gỡ AI-feel</summary>

**Làm gì:**
- BE `admin.py`: thêm `GET /admin/crm/demographics` (by_source/by_country/by_device), `GET /admin/crm/conversation-overview` (stats/intent_breakdown/trend_7d/funnel), `GET /admin/crm/conversations/{session_id}/profile` (linked_user qua phone/email regex, intent_history)
- BE helper `_classify_intent`: 5 cluster keyword match (product_search/price_inquiry/order_lookup/shipping_inquiry/complaint)
- FE `AdminCRM.tsx`: xoá Intent Clusters fake demo + nhãn "Demo — AI phân loại tự động"; restructure 3→4 tabs khớp mockup `/DHTC/admin/crm/*.html`
- FE thêm ConversationsTab (KPI strip · intent bars · 7-day mini chart · funnel · conversation table click → drawer) và BehaviorTab (banner P2 · 4 KPI "—" · 3 empty state · funnel skeleton · 24h chart)
- FE thêm `SourceBadge`, `CountryFlag`, `MiniBarChart`, `HourlyBarChart`, `EmptyState`, `ConversationDetailDrawer` 3-pane
- Tests: `tests/test_admin_crm.py` (6 pytest, happy + 401 cho mỗi endpoint) + 2 Playwright e2e (4-tab navigate, no-AI-residue) — tất cả pass

**Commit:** `0ff18bc` — feat: build DHTC marketplace + CRM admin 4-tab match mockup

</details>

<details>
<summary>2026-05-16 · Hoàn thiện SDD infrastructure — /spec command, session ritual, bài giảng</summary>

**Làm gì:**
- Tạo `.claude/commands/spec.md` — `/spec <name>` scaffold 4-file spec với template đầy đủ
- CLAUDE.md: thêm session ritual (ĐẦU/TRONG/CUỐI phiên), Verification Gate, "Luôn lưu plan"
- `docs/structure.md`: cập nhật — thêm `01-auth/`, `/spec` command
- `handoff.md`: refactor sang TL;DR + `<details>` collapsed pattern (≤200 dòng)
- `course_content.html`: CLAUDE.md v0 template thêm session ritual + Verification Gate; React 18→19; tasks.md example hiển thị ticked ✅ pattern

**Commit:** `432fbba` — feat: add SDD infrastructure — /spec command, auth spec, session ritual in CLAUDE.md

</details>

<details>
<summary>2026-05-16 · Hoàn thiện auth flow + SDD infrastructure (15 files thay đổi)</summary>

**Làm gì:**
- Thêm `POST /auth/register` endpoint (thiếu trước đó mặc dù runbook đề cập)
- Tách `UserRead` từ `schemas/auth.py` → `schemas/user.py`
- Thêm `useCurrentUser` hook, `UserRead` type FE, `getMe()` API
- Update `Home.tsx` hiển thị user info thật
- Thêm 2 register tests (9 tests tổng, tất cả pass)
- Fix ruff B008/N806/I001, thêm `pydantic[email]` dep
- Tạo toàn bộ docs/ structure: specs, adr, runbooks
- Refactor CLAUDE.md → 80 dòng với @imports
- Tạo handoff.md, docs/structure.md

**Commit:** `762b26b` — feat: complete auth flow — register endpoint, useCurrentUser, schema split

</details>

<details>
<summary>2026-05-15 · Add .claude/ infrastructure (settings.json, hooks, agents, commands)</summary>

**Làm gì:**
- Tạo `.claude/settings.json` với allow/deny/ask permissions
- Tạo `hooks/block-dangerous.sh` (PreToolUse: chặn force push, --no-verify)
- Tạo `hooks/validate-types.sh` (PostToolUse: nhắc mypy/tsc sau khi edit)
- Tạo `.claude/agents/code-reviewer.md` + `db-architect.md`
- Tạo `.claude/commands/feature.md` (/feature scaffold) + `migration.md`
- Tạo `AGENTS.md` (universal brief cho Codex/Cursor/Copilot)

**Commit:** `4869cf6` — chore: add Claude Code project infrastructure (.claude/)

</details>

<details>
<summary>2026-05-15 · Init fullstack-template với auth end-to-end</summary>

**Làm gì:**
- React 19 + Vite 6 + TypeScript strict + Tailwind v4
- FastAPI 0.115 + SQLAlchemy 2.0 async + Alembic + bcrypt
- Auth flow: login → JWT → sessionStorage → ProtectedRoute
- CI: GitHub Actions parallel backend + frontend
- Docker multi-stage + nginx

**Commit:** `29e149e` — init: fullstack-template

</details>

---

## Cách update file này

Cuối mỗi phiên, cập nhật **TL;DR** và thêm **1 `<details>` block** mới vào đầu session log:

```markdown
<details>
<summary>YYYY-MM-DD · [mô tả 1 dòng những gì đã làm]</summary>

**Làm gì:** [gạch đầu dòng ngắn]
**Commit:** [sha] — [message]

</details>
```

**KHÔNG dùng file này như git log.** Chi tiết → `git log`. Handoff chỉ lưu state hiện tại + context khó khôi phục.  
**KHÔNG để file vượt 200 dòng.** Session cũ hơn 30 ngày → move sang `handoff-archive/YYYY-MM.md`.
