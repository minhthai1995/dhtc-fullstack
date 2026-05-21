# Tasks — Feature: P5E · Proactive Reply

**Tổng thời gian ước tính:** ~10-12 giờ
**Status:** 📝 Drafting — chờ duyệt + chờ App Review

> ⚠️ Code có thể implement xong trước, nhưng KHÔNG go-live (PROACTIVE_REPLY_ENABLED=false) cho tới khi Meta approve `pages_manage_engagement` + `pages_read_user_content`.
> Conventional Commits, 1 task = 1 commit, subject ≤72 chars.

---

## Phase 0 — Meta App Review (parallel, không block code)

- [ ] **T0** (60') — Submit App Review:
  - Permissions: `pages_manage_engagement`, `pages_read_user_content`
  - Use case write-up: "Auto-acknowledge customer check-ins and mentions at DHTC stores via templated comments"
  - Screencast: dry-run mode showing event → audit log
  - Privacy policy link must be live
  - **NO commit** — admin task, tracked trong Linear/Trello

## Phase 1 — Schema

- [ ] **T1** (25') — Models: `ProactiveReply`, `CommentThread`, `ProactiveTemplateConfig`. Enums cho intent + status. Register `__init__.py`.
  - Commit: `feat(backend): add proactive_reply models`

- [ ] **T2** (30') — Alembic migration `create_proactive_reply_tables` + seed 5 row vào `proactive_template_config` (checkin/praise enabled; complaint/question/other disabled). Round-trip verify.
  - Commit: `chore(backend): migration proactive_reply + seed configs`

## Phase 2 — Service layer

- [ ] **T3** (20') — `app/services/post_intent.py` — `classify_post_intent(text, has_checkin)`. Unit test 20 fixtures.
  - Commit: `feat(backend): post intent classifier (5 categories)`

- [ ] **T4** (20') — `app/services/reply_templates.py` — TEMPLATES dict + `pick_template(intent)`. 3-5 variants per intent.
  - Commit: `feat(backend): VN reply templates per intent`

- [ ] **T5** (25') — `app/services/page_comment_service.py` — `post_comment(post_id, message, page_token)` với httpx, timeout 10s, raise on HTTP error.
  - Commit: `feat(backend): page comment service (Graph API wrapper)`

- [ ] **T6** (30') — `app/crud/proactive_reply.py` — `get_by_post_id`, `count_replies_today(page_id)`, `psid_replied_within_24h(psid)`, `create_audit(...)`, `get_template_config(intent)`, `update_template_config(intent, is_enabled, user_id)`.
  - Commit: `feat(backend): proactive_reply CRUD`

- [ ] **T7** (40') — `app/services/proactive_reply_service.py` — `handle_feed_event(event, db)` với full flow: dedup → rate limit → classify → config check → cooldown → pick template → dry-run/send → audit. Add `PROACTIVE_REPLY_ENABLED` to config.
  - Commit: `feat(backend): proactive reply orchestrator service`

- [ ] **T8** (35') — Tests `tests/test_proactive_reply_service.py`: mock httpx + DB → assert each branch (dedup, rate limit, disabled intent, cooldown, dry-run, sent, error). ≥10 case.
  - Commit: `test(backend): proactive_reply_service all branches`

## Phase 3 — Webhook integration

- [ ] **T9** (25') — Edit `app/api/v1/webhooks.py`: extend `ALLOWED_FIELDS` thêm `feed`, `mentions`. Route field `feed` → `handle_feed_event`. Verify signature still passes.
  - Commit: `feat(backend): webhook dispatch feed+mentions to proactive`

- [ ] **T10** (25') — Tests `tests/test_webhook_feed.py`: POST feed event payload (verb=add, item=status, with place) → assert proactive_replies row created với intent='checkin'.
  - Commit: `test(backend): webhook feed event → proactive reply`

## Phase 4 — DM escalation

- [ ] **T11** (35') — `app/services/dm_escalation_service.py` — `handle_comment_reply(event, db)`. Check 24h window via `get_last_inbound_message`. Send DM via existing `messenger_service`. Update `comment_threads`.
  - Commit: `feat(backend): DM escalation when user replies to our comment`

- [ ] **T12** (25') — Tests `tests/test_dm_escalation.py`: PSID có inbound <24h → DM sent; PSID stale → window_expired; comment_id không match thread → no-op.
  - Commit: `test(backend): DM escalation 24h window logic`

## Phase 5 — Admin API + frontend

- [ ] **T13** (25') — Edit `app/api/v1/admin.py`: `GET /admin/proactive/replies` với filter (intent, status, date range, limit). `PATCH /admin/proactive/templates/{intent}` toggle.
  - Commit: `feat(backend): admin endpoints proactive replies + config`

- [ ] **T14** (20') — Tests `tests/test_admin_proactive.py`: auth (require admin), filter combinations, toggle persistence.
  - Commit: `test(backend): admin proactive endpoints`

- [ ] **T15** (20') — `frontend/src/features/admin/proactive.api.ts` + hooks `useProactiveReplies()`, `useToggleTemplate()`.
  - Commit: `feat(frontend): proactive reply API client`

- [ ] **T16** (40') — `frontend/src/pages/admin/AdminProactiveReply.tsx`: 5 toggle cards (intent + last 24h count + template preview), audit log table với filter, dry-run banner, rate limit banner. Route `/admin/proactive-reply`.
  - Commit: `feat(frontend): admin proactive reply page`

- [ ] **T17** (15') — Nav link trong admin sidebar. tsc + build clean.
  - Commit: `chore(frontend): nav link + build verify`

## Phase 6 — Pre-launch checklist

- [ ] **T18** (30') — Smoke test end-to-end với webhook simulator (curl POST mock payload) — assert audit row + (dry-run) comment text correct. Document trong handoff cách enable production.
  - Commit: `chore: P5E smoke test + go-live runbook`

- [ ] **T19** (15') — Update `handoff.md`: P5E ✅ implementation, ⏳ App Review pending. Link spec + audit của Meta submission ngày.
  - Commit: `docs: handoff P5E implementation done, awaiting App Review`

---

## Tổng kết (điền sau)

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 19 (gồm T0 không-commit) | _TBD_ |
| Tests | 4 file mới / ~25 case | _TBD_ |
| Files mới | 10 (3 model + 5 service + 1 CRUD + 1 frontend page) | _TBD_ |
| Files edit | 4 (webhooks.py, admin.py, models/__init__.py, sidebar) | _TBD_ |
| Migrations | 1 | _TBD_ |
| Thời gian | ~10-12h | _TBD_ |
| App Review SLA | 4-8 tuần (Meta) | _TBD_ |
