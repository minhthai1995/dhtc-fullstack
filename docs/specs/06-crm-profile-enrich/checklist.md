# Checklist — Feature: P5C-enrich · CRM Profile Enrichment

**Status:** 🔴 Not started

---

## Phase 1 — Schema + model

- [ ] `app/models/fb_profile.py` extended với 10 cột messenger_*, `user_id` + `fb_app_user_id` nullable
- [ ] `app/models/fb_graph_call_log.py` exists
- [ ] `FBGraphCallLog` registered trong `app/models/__init__.py`
- [ ] Migration generated với naming convention đúng (xem `app/models/base.py` NAMING_CONVENTION)
- [ ] `alembic upgrade head` + `downgrade -1` + `upgrade head` clean
- [ ] `pytest -q` không break test cũ (especially `test_auth_facebook.py` 9 cases)

## Phase 2 — Service + CRUD

- [ ] `fb_profile_crud.get_by_psid` returns Optional[row]
- [ ] `upsert_messenger_cache` idempotent: 2 calls cùng PSID → 1 row, `messenger_fetched_at` updated
- [ ] `FBGraphService.fetch_messenger_profile`:
  - [ ] Cache hit (<30 ngày) → KHÔNG call httpx
  - [ ] Cache miss → call httpx → UPSERT → return
  - [ ] HTTP 400 (opted_out) → upsert `messenger_status='opted_out'`
  - [ ] Timeout 5s → raise + log
- [ ] `derive_country`: VN address → 'VN'; foreign → 'OTHER'; no order → None
- [ ] `derive_language`: vi-heavy text → 'vi'; en text → 'en'; ratio thấp → 'mixed'/None
- [ ] `extract_declared_birthday`: "sinh năm 1995" → "1995"; "sinh ngày 15/3/1990" → "1990-03-15"

## Phase 3 — Webhook integration

- [ ] Webhook POST PSID mới → BackgroundTasks queued
- [ ] After background settle, `fb_profiles` row exists với `messenger_name`, `messenger_pic_url` populated
- [ ] Webhook POST PSID cũ (cache fresh) → KHÔNG có task mới (assertion qua mock spy)
- [ ] Webhook handler vẫn respond 200 trong <2s dù background task pending

## Phase 4 — Admin endpoint

- [ ] `GET /admin/crm/conversations` payload có key `profile`
- [ ] PSID có cache → profile.fb_name, profile.fb_avatar_url, profile.gender filled
- [ ] PSID chưa có cache → profile = null
- [ ] derived_country/lang/birthday compute đúng theo seed data
- [ ] Endpoint <500ms với 50 conversations (manual timing)

## Phase 5 — Frontend

- [ ] `npx tsc --noEmit` exit 0
- [ ] `npm run build` exit 0
- [ ] CustomersTab table render đủ 7 cột mới
- [ ] PSID chưa cache → "Đang đồng bộ…" italic muted
- [ ] PSID opted_out → 🔒 Privacy-protected
- [ ] Country null → "—" italic muted (KHÔNG fake 🇻🇳)
- [ ] Avatar 8x8 rounded, name 14px medium, PSID 10px mono dưới name
- [ ] Mobile responsive: cards mode ≤768px

## Phase 6 — Documentation

- [ ] `handoff.md` P5C-enrich ✅ với commit SHA
- [ ] `tasks.md` tick 100%
- [ ] `requirements.md` status ✅ Implemented
- [ ] `.env.example` có `FACEBOOK_PAGE_ACCESS_TOKEN`

---

## Pass criteria toàn spec

- ✅ Suite pass: backend `pytest -q` + frontend `tsc --noEmit`
- ✅ ≥80% PSID active 7 ngày có profile.fb_name hiển thị
- ✅ Empty state nhất quán "—" italic muted cho field thiếu
- ✅ KHÔNG hardcode fake name/avatar
- ✅ KHÔNG scrape facebook.com
- ✅ Graph API call ≤200 req/hour (Meta limit ~4800)
- ✅ Privacy: PSID opted_out → hiển thị 🔒 không leak data
