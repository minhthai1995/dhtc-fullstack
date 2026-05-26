# Screencast Script — Meta App Review

**Mục tiêu**: 1 video duy nhất ~5-7 phút demo end-to-end cả 5 permissions trong flow business thực tế. Meta reviewer xem 1 lần là hiểu use case.

**Định dạng**: MP4, 1920x1080, 30fps, narration tiếng Anh (vì reviewer ở US/Ireland), subtitle EN burn-in.

**Tool quay**: OBS Studio (free) hoặc QuickTime + Loom. Phải có **mouse highlight** + **keystroke overlay** để reviewer thấy rõ thao tác.

---

## Scene 1 — Intro (0:00 - 0:30)

**Visual**: Landing page https://dhtcdanang.com — show real night market photos, English/Vietnamese toggle.

**Narration (EN)**:
> "Hello Meta reviewer. This is DHTC, an internal CRM tool for Cho Dem Son Tra Night Market in Da Nang, Vietnam. We manage one Facebook Page that belongs to our business, with around 300-500 customer check-ins every night. I'll demonstrate why we need all five permissions in a single end-to-end flow."

**On screen text**: "Single-tenant CRM · 1 Page · ~400 check-ins/night"

---

## Scene 2 — `pages_show_list` (0:30 - 1:15)

**Visual**: 
1. Navigate `/admin/login` → login as DHTC admin
2. Go to `/admin/settings/fb-connect`
3. Click "Connect Facebook Page"
4. Facebook OAuth popup appears → check permissions screen lists 5 perms
5. After consent, app shows dropdown listing Pages the admin manages
6. Admin selects "Cho Dem Son Tra — Wonders Night Market"
7. Confirm screen: "Connected. Page ID: 1234567890"

**Narration (EN)**:
> "First, our admin connects the Facebook Page. We use pages_show_list to fetch the list of Pages this user administers, so they can confirm the correct Page. This is a one-time onboarding step — we don't expose this list to any other user."

**Highlight**: Cursor on the dropdown showing only Pages the admin actually manages.

---

## Scene 3 — `pages_read_engagement` (1:15 - 2:00)

**Visual**:
1. Navigate `/admin/dashboard`
2. Show engagement chart: "Last 7 days: 2,184 check-ins, 612 comments, 156 DMs"
3. Click on yesterday's bar → drill-down: "Yesterday: 312 check-ins, 87 comments"
4. Show "Peak hours" widget: 19:00-21:00 highest

**Narration (EN)**:
> "Once connected, we read engagement insights to understand traffic patterns. This dashboard shows our admin when peak hours are, so they can schedule staff accordingly. We pull aggregate metrics every 15 minutes — no individual user data on this screen."

**Highlight**: The "7-day engagement" chart.

---

## Scene 4 — `pages_read_user_content` (2:00 - 3:00)

**Visual**:
1. Navigate `/admin/proactive/queue`
2. Show inbox of recent check-in posts: each row has user name, post snippet, time, intent label
3. Click a check-in post → drill-down shows: original post content, location tag, photos
4. Show intent classifier results: "check-in (0.92)", "praise (0.41)", etc.

**Narration (EN)**:
> "When a customer checks in at our market, we receive a webhook for the feed field. We read the post content to classify intent: check-in, praise, complaint, or question. This is the only signal we have that someone just visited, because they haven't shared their phone number yet. We store these posts for 90 days only to train our keyword classifier, then delete the raw content."

**Highlight**: Intent classification labels on the inbox rows.

---

## Scene 5 — `pages_manage_engagement` (3:00 - 4:15)

**Visual**:
1. From the queue, click a check-in post
2. Show "Suggested reply" panel with 3 pre-approved templates:
   - "Cảm ơn anh/chị đã ghé Chợ Đêm Sơn Trà! 🎁 Nhắn shop nhận voucher 50K → m.me/..."
   - "Thank you for visiting Son Tra Night Market! 🎁 DM us for a 50K voucher → m.me/..."
   - "Hẹn gặp lại tối mai nhé! ❤️"
3. Staff clicks "Approve & Send" on template #1
4. Toast: "Reply posted to comment"
5. Show Facebook post in another tab → comment appears on the original post

**Narration (EN)**:
> "Staff reviews the suggested reply — every template is pre-approved by the admin and stored in our database. When staff clicks Approve, we POST to the comments endpoint. Notice the reply contains an m.me link, not a direct sales pitch — this complies with Meta's 24-hour Messaging Policy because we wait for the user to open the conversation. We rate-limit to 50 replies per page per day, and there's a kill switch in our environment config to disable this feature instantly if needed."

**Highlight**: The m.me link in the template + the "Approve" button click.

---

## Scene 6 — `pages_messaging` (4:15 - 5:30)

**Visual**:
1. Switch to the Test User's Facebook account (or use a second device)
2. Click the m.me link from the comment reply
3. Messenger opens → Test User sends: "Shop ơi cho mình xin voucher"
4. Switch back to DHTC admin → navigate `/admin/crm/conversations`
5. Show new conversation in inbox with "🟢 Within 24h" tag
6. Click conversation → thread view shows user message + timestamp "2 min ago"
7. Show "Send voucher" button (only enabled because <24h)
8. Click → confirmation modal: "Send Welcome Voucher template?"
9. Click Confirm → toast: "Message sent"
10. Switch to Test User Messenger → see the voucher message arrive with code "DHTC50K"

**Narration (EN)**:
> "Here's the critical compliance piece. The customer clicked our m.me lure and sent the first message — this opens the 24-hour messaging window per Meta policy. Our backend checks the timestamp of the user's last message before every send. If it's been more than 24 hours, the Send button is disabled and we show a clear message to staff. We never cold-DM."

**Visual**: Highlight the "🟢 Within 24h" tag + the disabled state for expired conversations.

---

## Scene 7 — Compliance & Privacy (5:30 - 6:15)

**Visual**:
1. Show `/admin/proactive/templates` → all templates are admin-controlled
2. Show kill switch in admin settings: "Proactive Reply: ENABLED" toggle
3. Show data deletion endpoint hit: `curl -X POST https://api.dhtcdanang.com/api/v1/meta/data-deletion -d '{"user_id": "..."}'` → returns confirmation code
4. Show privacy policy page in browser

**Narration (EN)**:
> "All templates are managed by the page admin — no AI-generated content goes out unreviewed. We have a kill switch in environment config. Our data deletion callback is wired up at the URL configured in the App Dashboard. Privacy Policy and Terms of Service are published at the URLs registered. All Facebook tokens are encrypted at rest with AES-256."

---

## Scene 8 — Outro (6:15 - 6:45)

**Visual**: Return to landing page, English version.

**Narration (EN)**:
> "To summarize: we serve one Facebook Page for our own night market business. Five permissions enable us to thank customers who visit, route them to Messenger compliantly, and respond to questions within Meta's 24-hour window. Thank you for reviewing."

**End card**: 
- Privacy Policy: https://dhtcdanang.com/privacy
- Terms: https://dhtcdanang.com/terms
- Contact: tech@dhtcdanang.com

---

## Recording Checklist

- [ ] Disable browser notifications (close Slack/Email)
- [ ] Browser zoom 110-125% so text is readable in 1080p
- [ ] Test User logged in on second browser/profile
- [ ] Real test FB Page (NOT the production Page) for screencast — Meta requires test data
- [ ] Audio: external mic, no background noise
- [ ] Subtitle: burn EN subtitles in case audio fails
- [ ] Export: H.264 MP4, < 100MB, < 7 phút
- [ ] Upload to YouTube unlisted + Google Drive (Meta accepts both)
- [ ] Paste video URL into Meta App Dashboard for each permission

---

## URLs to verify before recording

- https://dhtcdanang.com (landing live)
- https://dhtcdanang.com/admin (admin reachable)
- https://api.dhtcdanang.com/api/v1/meta/data-deletion (returns 200 on POST)
- https://dhtcdanang.com/privacy (policy live)
- https://dhtcdanang.com/terms (terms live)

Nếu BẤT KỲ URL nào trả 404 → KHÔNG QUAY VIDEO, fix trước.
