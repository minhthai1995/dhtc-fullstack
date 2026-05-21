# Requirements — Feature: P5E · Proactive Reply on Check-in/Mention

**Version:** 0.1 (draft)
**Status:** 🔴 Draft — chờ duyệt
**Last updated:** 2026-05-21

---

## Mô tả

Khi khách checkin tại DHTC trên Facebook (qua post tag Page) hoặc mention Page trong post của họ, bot tự động comment trả lời theo template intent-aware (cảm ơn checkin / phản hồi complaint / trả lời câu hỏi). Nếu khách reply lại comment đó → bot mở Messenger DM thread (trong 24h window) để tiếp tục.

Mục tiêu: tăng customer engagement, không bỏ sót touch point khi khách chủ động nhắc tới brand.

⚠️ **Yêu cầu App Review của Meta**: `pages_manage_engagement` + `pages_read_user_content` — submit + chờ duyệt 4-8 tuần. Implementation có thể tiến hành parallel, deploy sau khi permission approved.

---

## Người dùng mục tiêu

- **User chính:** admin DHTC (config templates, xem audit)
- **User gián tiếp:** khách hàng FB (nhận comment auto)
- **Quy mô MVP:** ~5-30 trigger event/ngày (checkin + mention + visitor post)

---

## Yêu cầu nghiệp vụ

### Phải có (Must have)

- [ ] Subscribe thêm webhook fields trên Page: `feed`, `mentions` (ngoài `messages` đã có)
- [ ] Handler nhận `feed` event verb=add → classify intent từ message text + check-in flag:
  - `checkin` (post có `place` attached)
  - `praise` (keyword: "tuyệt vời", "ngon", "đỉnh", "love")
  - `complaint` (keyword: "tệ", "chán", "lừa", "trả tiền")
  - `question` (chứa `?` hoặc keyword "ai cho hỏi", "shop ơi")
  - `other` (fallback)
- [ ] Template VN tĩnh per intent, lưu trong `app/services/reply_templates.py`. Mỗi intent có 3-5 biến thể, random chọn (tránh repetitive).
- [ ] Post comment qua `POST /v22.0/{post-id}/comments` với Page Access Token
- [ ] Rate limit: tối đa 50 reply/page/day (Meta soft limit ~200 nhưng giữ an toàn)
- [ ] Kill switch: env var `PROACTIVE_REPLY_ENABLED=false` để admin tắt khẩn cấp
- [ ] Audit log: bảng `proactive_replies` ghi `post_id, post_url, post_text, intent, template_used, reply_text, sent_at, status, error`
- [ ] DM escalation: khi user reply lại comment ta gửi → webhook field `feed` verb=add item=comment với `parent_id` = comment id ta → match `comment_threads` table → mở Messenger thread (gửi message standard 24h window nếu PSID đã từng nhắn page) hoặc gửi "Message Tag" `CUSTOMER_FEEDBACK` (cần thêm permission)
- [ ] Admin endpoint `GET /api/v1/admin/proactive/replies` xem audit + filter (intent, date range, status)
- [ ] Admin endpoint `PATCH /api/v1/admin/proactive/templates/{intent}` toggle enable/disable per intent (lưu vào table `proactive_template_config`)

### Nên có (Should have)

- [ ] Frontend admin tab "Reply tự động" (subpage of CRM hoặc Settings):
  - Toggle on/off per intent
  - Xem audit log table
  - Xem template preview + edit (chỉ admin)
- [ ] Webhook deduplication: cùng post_id → KHÔNG reply 2 lần (UNIQUE constraint trên `post_id` table audit)
- [ ] Cooldown: cùng PSID → max 1 reply/24h (tránh spam khi user post liên tục)

### Không làm (Out of scope)

- ❌ LLM-generated reply (giữ template tĩnh, dễ kiểm soát)
- ❌ Reply image/sticker (chỉ text)
- ❌ Reply trên Instagram (Meta tách permission khác, defer)
- ❌ Edit/delete comment ta gửi
- ❌ Bot recognition (giả định FB đã filter bot users)

---

## Tiêu chí thành công

- ≥95% trigger event được handle trong <10s (webhook receive → comment posted)
- 0 false reply (reply nhầm post không phải về DHTC) trong 100 event đầu — đảm bảo qua kiểm tra manual + dry-run mode trước go-live
- Admin xem được audit log đầy đủ, filter hoạt động
- Template config persist, restart server không reset

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Meta App Review reject | Backup plan: chỉ deploy phần intent classifier + audit log để admin reply manual; comment auto disabled |
| Reply nội dung vô duyên/sai context | Dry-run mode: log "would reply X" nhưng KHÔNG post 1 tuần đầu; admin review báo cáo trước khi enable |
| User spam tag Page → bot reply 100 lần | Cooldown 24h/PSID + daily rate limit + kill switch env |
| Comment ta bị FB flag là spam | Template VN tự nhiên, random variant, KHÔNG chứa URL/promo trong comment đầu |
| 24h messaging window expired khi escalate DM | Fallback: gửi message tag `CUSTOMER_FEEDBACK` (cần xin) hoặc skip DM escalation, log skip reason |
| mTLS cert deadline 31/03/2026 | Coordinate với DevOps trước hạn — webhook endpoint cần trust Meta's new internal CA |

---

## Dependencies

- ⏳ **App Review approval** cho `pages_manage_engagement` + `pages_read_user_content` (block deploy, không block dev)
- ✅ P5B Webhook foundation (signature verify, basic handler) đã có
- ✅ P5C-enrich (spec 06) — DM escalation cần `messenger_profiles` để biết PSID
- ⏳ `FACEBOOK_PAGE_ACCESS_TOKEN` env (shared với spec 06)
- ⏳ Cron job (hoặc Redis) cho daily rate limit reset
