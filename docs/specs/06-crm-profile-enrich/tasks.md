# Tasks — Feature: P5C-enrich · CRM Profile Enrichment

**Tổng thời gian ước tính:** ~6-7 giờ
**Status:** 📝 Drafting — chờ duyệt

> - Mỗi task = 1 commit, ≤30 phút
> - Conventional Commits, subject ≤72 chars
> - Tick khi xong: `- [x] T1 ✅ <sha>`

---

## Phase 1 — Schema + model

- [ ] **T1** (20') — Extend `app/models/fb_profile.py`: add `page_id`, `messenger_name`, `messenger_pic_url`, `messenger_age_range_min/max`, `messenger_gender`, `messenger_locale`, `messenger_fetched_at`, `messenger_status`, `messenger_error_message`. Make `user_id` + `fb_app_user_id` nullable.
  - Commit: `feat(backend): extend fb_profiles with messenger cache fields`

- [ ] **T2** (15') — Tạo `app/models/fb_graph_call_log.py`: `FBGraphCallLog` debug table. Register vào `__init__.py`.
  - Commit: `feat(backend): add FBGraphCallLog model`

- [ ] **T3** (25') — Alembic migration `extend_fb_profiles_messenger_cache + create_fb_graph_call_log`. Round-trip verify upgrade/downgrade.
  - Commit: `chore(backend): migration extend fb_profiles + graph log`

## Phase 2 — Service + CRUD

- [ ] **T4** (15') — Extend `app/crud/fb_profile.py`: add `get_by_psid`, `upsert_messenger_cache(psid, page_id, data)`, `upsert_messenger_error(psid, err)`, `get_stale(older_than)`.
  - Commit: `feat(backend): fb_profile CRUD upsert messenger cache`

- [ ] **T5** (30') — `app/services/fb_graph_service.py` — `fetch_messenger_profile` với httpx, timeout 5s, cache check 30 ngày, log call. Thêm `PAGE_ACCESS_TOKEN` vào `config.py` + `.env.example`.
  - Commit: `feat(backend): FBGraphService.fetch_messenger_profile`

- [ ] **T6** (25') — `app/services/customer_derive.py`: `derive_country`, `derive_language`, `extract_declared_birthday` với regex + VN city keyword dict. Unit test fixtures.
  - Commit: `feat(backend): customer_derive helpers (country/lang/birthday)`

## Phase 3 — Webhook integration

- [ ] **T7** (20') — Edit `app/api/v1/webhooks.py`: sau save inbound message, check cache + add `BackgroundTasks` task gọi `fetch_messenger_profile_safe` (mở session DB riêng).
  - Commit: `feat(backend): trigger profile fetch on first webhook seen`

- [ ] **T8** (25') — Tests `tests/test_webhook_profile_fetch.py`: mock httpx Graph response → POST webhook PSID mới → assert messenger_profiles row created sau await BackgroundTasks. Test cache hit (không gọi Graph lần 2 trong 30 ngày).
  - Commit: `test(backend): webhook triggers Graph cache fetch`

## Phase 4 — Admin endpoint enrich

- [ ] **T9** (25') — Edit `app/api/v1/admin.py` `GET /admin/crm/conversations`: JOIN messenger_profiles, derive country/lang/birthday on-the-fly. Schema `ConversationSummaryEnriched` với nested `profile` object.
  - Commit: `feat(backend): enrich /admin/crm/conversations with profile`

- [ ] **T10** (25') — Tests `tests/test_admin_crm_enriched.py`: seed PSID + MessengerProfile + Order với VN address → GET → assert profile.fb_name, derived_country='VN', etc. Test PSID không có profile → profile=null.
  - Commit: `test(backend): /admin/crm/conversations enriched payload`

## Phase 5 — Frontend

- [ ] **T11** (20') — `frontend/src/features/admin/admin.api.ts`: thêm types `ConversationProfile`, `ConversationSummaryEnriched`. Update `getCRMConversations()` return type.
  - Commit: `feat(frontend): admin API types for enriched conversations`

- [ ] **T12** (30') — `frontend/src/pages/admin/AdminCRM.tsx` `CustomersTab`: cột table mới (Avatar+Name, Tuổi, Giới tính, Quốc gia, Ngôn ngữ, Sinh nhật, Last seen). Component `<ProfileCell />` với empty state "Đang đồng bộ…" / "—" / 🔒.
  - Commit: `feat(frontend): CRM customers tab shows enriched profile`

- [ ] **T13** (15') — Verify: `npx tsc --noEmit` clean. Navigate `/admin/crm` → seed webhook event → refresh → thấy avatar + name thật.
  - Commit: `chore: verify CRM enriched view end-to-end`

## Phase 6 — Polish + handoff

- [ ] **T14** (15') — Update `handoff.md`: P5C-enrich ✅, link spec, screenshot CRM trước/sau (nếu user yêu cầu).
  - Commit: `docs: handoff P5C-enrich complete`

---

## Tổng kết (điền sau)

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 14 | _TBD_ |
| Tests | 3 file mới / ~8 case | _TBD_ |
| Files mới | 4 (1 model + 2 service + 1 migration) | _TBD_ |
| Files edit | 6 (fb_profile.py, fb_profile crud, webhooks.py, admin.py, models/__init__.py, AdminCRM.tsx) | _TBD_ |
| Migrations | 1 | _TBD_ |
| Thời gian | ~6-7h | _TBD_ |
