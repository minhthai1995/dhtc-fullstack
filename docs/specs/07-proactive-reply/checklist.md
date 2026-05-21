# Checklist — Feature: P5E · Proactive Reply

**Status:** 🔴 Not started

---

## Phase 0 — Meta App Review

- [ ] App Review submitted với cả 2 permissions
- [ ] Privacy policy URL live & valid
- [ ] Screencast uploaded
- [ ] Business verification status active

## Phase 1 — Schema

- [ ] 3 models registered: `ProactiveReply`, `CommentThread`, `ProactiveTemplateConfig`
- [ ] Migration upgrade + downgrade + upgrade clean
- [ ] Seed 5 rows vào template_config: checkin=on, praise=on, complaint=off, question=off, other=off
- [ ] UNIQUE constraint `proactive_replies.post_id` enforced (test: insert 2 cùng post_id → IntegrityError)
- [ ] CASCADE FK `comment_threads.proactive_reply_id` (delete reply → thread gone)

## Phase 2 — Service

- [ ] `classify_post_intent`:
  - [ ] has_checkin=true → 'checkin' regardless of text
  - [ ] "Tệ quá shop" → 'complaint'
  - [ ] "Ngon tuyệt vời" → 'praise'
  - [ ] "Shop ơi cho hỏi?" → 'question'
  - [ ] "Hi" → 'other'
- [ ] `pick_template` returns (key, text), key format `{intent}_v{n}`
- [ ] `post_comment` mock returns comment_id
- [ ] `handle_feed_event` paths:
  - [ ] Existing post_id → dedup skip, no insert
  - [ ] Today count ≥ 50 → status='skipped_rate_limit'
  - [ ] intent disabled → status='skipped_disabled'
  - [ ] PSID cooldown <24h → status='skipped_cooldown'
  - [ ] PROACTIVE_REPLY_ENABLED=false → status='dry_run', no Graph call
  - [ ] Happy path → status='sent', comment_id populated, comment_threads row created
  - [ ] HTTP error → status='error', error_message populated

## Phase 3 — Webhook

- [ ] `ALLOWED_FIELDS` chứa 'feed', 'mentions'
- [ ] POST feed event → handle_feed_event called (assertion qua spy/mock)
- [ ] POST checkin event → audit row intent='checkin', has_checkin=true
- [ ] Signature verify still passes cho field mới

## Phase 4 — DM escalation

- [ ] `handle_comment_reply` matches comment_threads.comment_id
- [ ] 24h window OK → DM sent, dm_status='sent', ChatMessage outbound row created
- [ ] Window expired → dm_status='window_expired', NO DM call
- [ ] Comment không phải của ta → no-op (no exception)

## Phase 5 — Admin API + frontend

- [ ] `GET /admin/proactive/replies`:
  - [ ] Require admin auth (401 cho non-admin)
  - [ ] Filter intent=checkin trả đúng subset
  - [ ] Filter status=sent loại bỏ dry_run/error
  - [ ] Date range works
  - [ ] Pagination limit/offset
- [ ] `PATCH /admin/proactive/templates/{intent}`:
  - [ ] Toggle persist sau restart
  - [ ] updated_by ghi đúng user
  - [ ] Invalid intent → 400
- [ ] Frontend `/admin/proactive-reply`:
  - [ ] 5 toggle cards render đúng config từ API
  - [ ] Toggle click → PATCH → optimistic update
  - [ ] Audit table render với filter UI
  - [ ] Dry-run banner show khi env disabled (qua check API hoặc env)
  - [ ] Rate limit banner show khi today count ≥ 50
  - [ ] tsc + build clean

## Phase 6 — Pre-launch

- [ ] Smoke test runbook documented trong handoff
- [ ] Go-live procedure: submit App Review → wait approval → flip `PROACTIVE_REPLY_ENABLED=true` → monitor first 24h
- [ ] Rollback plan: env false + admin disable all intents
- [ ] mTLS cert cho webhook endpoint update before 2026-03-31 (Meta deadline)

---

## Pass criteria toàn spec

- ✅ Suite pass: backend + frontend
- ✅ ≥95% trigger event handled < 10s (manual timing với mock webhook)
- ✅ Dedup hoạt động: 100 duplicate webhook → 1 audit row
- ✅ Rate limit 50/day enforced
- ✅ Dry-run mode: 0 actual API call, đầy đủ audit log
- ✅ Privacy: comment template KHÔNG chứa data cá nhân (tên, phone) của user
- ✅ Admin có full visibility + kill switch
- ✅ App Review approved trước khi flip `PROACTIVE_REPLY_ENABLED=true`
