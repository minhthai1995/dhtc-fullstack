# Handoff — fullstack-template

> **Đọc TL;DR bên dưới trước khi làm bất cứ điều gì. Phần session log đóng mặc định — Claude không tự mở.**

---

## TL;DR (đọc đầu phiên mới — ≤ 30 dòng)

- **Đây là:** DHTC marketplace fullstack (Đà Nẵng truyền thống) — đã rời template, đang build feature thật
- **Đã có:** Auth ✅ · Admin/Seller/Customer portals ✅ · Chatbot Messenger ✅ · CRM admin 4-tab ✅ · Page tracking P2 ✅
- **Vừa xong (2026-05-20):** Feature P3 product image upload end-to-end (spec 32 task → BE → FE → e2e)
  - BE: `Pillow + pillow-heif` (HEIC iPhone), `POST /products/images` server-side resize 4 size WebP (original 1600/large 800/medium 400/thumb 200) + EXIF auto-rotate + anti-bomb guard, `DELETE /products/images/{id}` idempotent + path-traversal block, StaticFiles mount `/uploads`
  - FE: `<ImageUploader>` drag-drop + multi-upload song song + onUploadProgress + client compression `browser-image-compression` cho file >1.5MB + reorder native HTML5 drag-drop + max 9 ảnh + toast VN errors + HEIC/JPG/PNG/WebP, integrate vào `SellerProductEdit.tsx` thay `<input type="url">`, `productImageSrc()` helper fallback `urls.medium ?? url` cho ProductCard + Shop
  - Backward compat: legacy `{url:""}` rows render qua `toProductImages()` spread URL ra 4 size keys — không cần DB migration
  - Tests: 8 pytest BE (happy/401/oversized/invalid-MIME/malformed/delete-idempotent/path-traversal/EXIF rotation) + 7 vitest FE (render/max-9/MIME/badge/compress-skip/compress-trigger/reorder) + 1 Playwright e2e (upload fixture JPEG inline) — all pass
- **Branch:** `main` — latest commit `ff4347e` (working tree clean sau khi tick T31/T32)
- **Blocked:** _(không)_
- **Files đang sửa:** _(không)_
- **Next session:** S3 migration cho production (hiện local `backend/uploads/`); Response time / conversion compute cho ConversationsTab; Redis-based rate limit; GeoIP country_code thật

---

## Active context

→ Sau commit lớn này, dirty tree sẽ về clean. Lần sau nhớ commit theo task để tránh dồn.
→ Pre-existing test failure trong `test_orders.py::test_cancel_order_restores_stock` (OrderEvent.created_at `'now()'` isoformat) — không phải do CRM work, để xử lý riêng.
→ Backend ruff có 66 lỗi pre-existing (F401/F811/E501/F841) — không gate CI hiện tại, cleanup sau.

---

## Session log

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
