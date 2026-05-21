# Design — Feature: P5E · Proactive Reply on Check-in/Mention

**Version:** 0.1 (draft)
**Status:** 🔴 Draft — chờ duyệt
**Last updated:** 2026-05-21

---

## Architecture flow

```
FB user posts checkin/mention → FB Webhook POST /webhook/facebook  field=feed/mentions
    ↓
verify signature → parse event
    ↓
deduplicate: SELECT proactive_replies WHERE post_id=X → if exists, skip
    ↓
check rate limit: COUNT replies today < 50 ?
    ↓
classify_intent(post_text, has_place_tag) → 'checkin' | 'praise' | ...
    ↓
check template_config: enabled[intent] = true ?
    ↓
choose template variant (random from list)
    ↓
if PROACTIVE_REPLY_ENABLED:
    POST /v22.0/{post_id}/comments  → success
else:
    log "would_reply" (dry-run)
    ↓
INSERT proactive_replies (post_id, intent, template, reply, status, ...)
    ↓
INSERT comment_threads (comment_id, post_id, psid_of_poster) — for escalation tracking
```

DM escalation (separate flow):
```
FB user reply lại comment ta → webhook feed verb=add item=comment, parent_id = our_comment_id
    ↓
match comment_threads.comment_id → resolve psid + intent
    ↓
check messaging_window_ok(psid):
    - last_inbound_to_page < 24h ago ? → YES → send DM standard
    - else → try message_tag CUSTOMER_FEEDBACK (need permission)
    - else → log "dm_window_expired"
    ↓
send Messenger DM via POST /me/messages
    ↓
INSERT chat_messages (direction=outbound, content=escalation_template)
```

---

## Schema DB

### `proactive_replies` — audit log

```sql
CREATE TABLE proactive_replies (
  id SERIAL PRIMARY KEY,
  page_id VARCHAR(64) NOT NULL,
  post_id VARCHAR(128) NOT NULL UNIQUE,         -- FB post id, dedup
  post_url TEXT,
  post_text TEXT,
  post_author_psid VARCHAR(64),
  has_checkin BOOLEAN NOT NULL DEFAULT false,
  place_name VARCHAR(255),
  intent VARCHAR(32) NOT NULL,                   -- enum: checkin/praise/complaint/question/other
  template_used VARCHAR(64),                     -- template key, vd 'checkin_v2'
  reply_text TEXT NOT NULL,
  reply_comment_id VARCHAR(128),                 -- FB id của comment ta đã gửi
  status VARCHAR(32) NOT NULL,                   -- queued/sent/dry_run/error/skipped_cooldown/skipped_disabled
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX proactive_replies_page_id_idx ON proactive_replies(page_id);
CREATE INDEX proactive_replies_psid_created_at_idx ON proactive_replies(post_author_psid, created_at);
CREATE INDEX proactive_replies_intent_idx ON proactive_replies(intent);
```

### `comment_threads` — escalation tracking

```sql
CREATE TABLE comment_threads (
  id SERIAL PRIMARY KEY,
  comment_id VARCHAR(128) NOT NULL UNIQUE,       -- comment id ta đã post
  post_id VARCHAR(128) NOT NULL,
  proactive_reply_id INTEGER NOT NULL REFERENCES proactive_replies(id) ON DELETE CASCADE,
  poster_psid VARCHAR(64),
  poster_replied_at TIMESTAMPTZ,                  -- khi user reply lại comment ta
  dm_sent_at TIMESTAMPTZ,                         -- khi ta đã escalate DM
  dm_status VARCHAR(32),                          -- sent/window_expired/error
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX comment_threads_post_id_idx ON comment_threads(post_id);
CREATE INDEX comment_threads_psid_idx ON comment_threads(poster_psid);
```

### `proactive_template_config` — admin toggle

```sql
CREATE TABLE proactive_template_config (
  intent VARCHAR(32) PRIMARY KEY,                 -- checkin/praise/complaint/question/other
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by INTEGER REFERENCES users(id)
);

-- Seed migration:
INSERT INTO proactive_template_config (intent, is_enabled) VALUES
  ('checkin', true), ('praise', true), ('complaint', false),  -- complaint default off — admin enable manual
  ('question', false), ('other', false);
```

---

## Templates

### `app/services/reply_templates.py`

```python
TEMPLATES: dict[str, list[str]] = {
    "checkin": [
        "Cảm ơn anh/chị đã ghé DHTC Đà Nẵng! Chúc anh/chị có trải nghiệm tuyệt vời 🌿",
        "DHTC rất vui khi đón anh/chị! Lần sau ghé nhớ thử món mới nhé 💚",
        "Cảm ơn anh/chị đã checkin DHTC. Tặng anh/chị voucher 10% cho lần ghé tiếp theo — IB shop để nhận ạ!",
        "Vinh dự khi được anh/chị lựa chọn DHTC! Mong gặp lại anh/chị sớm 🍃",
    ],
    "praise": [
        "Cảm ơn anh/chị nhiều lắm! DHTC sẽ tiếp tục nỗ lực để phục vụ tốt hơn 🙏",
        "Phản hồi của anh/chị là động lực lớn cho team DHTC ạ. Cảm ơn anh/chị!",
        "Cám ơn anh/chị đã yêu mến DHTC ❤️ Hẹn gặp lại anh/chị sớm!",
    ],
    "complaint": [
        "DHTC rất xin lỗi vì trải nghiệm chưa tốt của anh/chị. IB shop để bộ phận CSKH hỗ trợ ngay ạ 🙏",
        "Cảm ơn anh/chị đã phản ánh. Team sẽ liên hệ riêng để xử lý sớm nhất — anh/chị check IB giúp shop nhé.",
    ],
    "question": [
        "Shop đã thấy câu hỏi của anh/chị, mời anh/chị IB để được trả lời chi tiết nhé!",
        "Cảm ơn anh/chị quan tâm DHTC. Anh/chị inbox giúp shop để team tư vấn cụ thể ạ 🌿",
    ],
    "other": [
        "Cảm ơn anh/chị đã quan tâm DHTC 🌿",
    ],
}

def pick_template(intent: str) -> tuple[str, str]:
    """Returns (template_key, template_text). Random variant per call."""
    variants = TEMPLATES.get(intent, TEMPLATES["other"])
    idx = random.randint(0, len(variants) - 1)
    return f"{intent}_v{idx + 1}", variants[idx]
```

---

## Intent classifier

### `app/services/post_intent.py`

```python
PRAISE_KEYWORDS = ["tuyệt vời", "ngon", "đỉnh", "love", "yêu", "tốt quá", "chất lượng"]
COMPLAINT_KEYWORDS = ["tệ", "chán", "lừa", "thất vọng", "tệ hại", "trả tiền", "kém", "không hài lòng"]
QUESTION_MARKERS = ["?", "ai cho hỏi", "shop ơi", "cho hỏi", "có ai biết"]

def classify_post_intent(text: str, has_checkin: bool) -> str:
    """Priority: checkin > complaint > praise > question > other."""
    if has_checkin:
        return "checkin"
    text_lower = text.lower()
    if any(k in text_lower for k in COMPLAINT_KEYWORDS):
        return "complaint"
    if any(k in text_lower for k in PRAISE_KEYWORDS):
        return "praise"
    if any(m in text_lower for m in QUESTION_MARKERS):
        return "question"
    return "other"
```

---

## Service layer

### `app/services/proactive_reply_service.py`

```python
async def handle_feed_event(event: dict, db: AsyncSession) -> None:
    post_id = event["post_id"]
    if await get_proactive_reply_by_post_id(db, post_id):
        return  # dedup

    # Rate limit
    today_count = await count_replies_today(db, page_id=event["page_id"])
    if today_count >= 50:
        await audit_skip(db, post_id, "rate_limit_exceeded")
        return

    text = event.get("message", "")
    has_checkin = "place" in event
    intent = classify_post_intent(text, has_checkin)

    config = await get_template_config(db, intent)
    if not config.is_enabled:
        await audit_skip(db, post_id, "intent_disabled", intent=intent)
        return

    # Cooldown per PSID
    psid = event.get("from", {}).get("id")
    if psid and await psid_replied_within_24h(db, psid):
        await audit_skip(db, post_id, "psid_cooldown", intent=intent)
        return

    template_key, reply_text = pick_template(intent)

    if not settings.PROACTIVE_REPLY_ENABLED:
        # Dry-run mode
        await audit_reply(db, post_id, intent, template_key, reply_text,
                          status="dry_run", comment_id=None)
        return

    try:
        comment_id = await post_comment(post_id, reply_text, settings.FACEBOOK_PAGE_ACCESS_TOKEN)
        reply_row = await audit_reply(db, post_id, intent, template_key, reply_text,
                                       status="sent", comment_id=comment_id)
        await create_comment_thread(db, comment_id, post_id, reply_row.id, psid)
    except httpx.HTTPError as e:
        await audit_reply(db, post_id, intent, template_key, reply_text,
                          status="error", error=str(e))
```

### `app/services/page_comment_service.py`

```python
async def post_comment(post_id: str, message: str, page_token: str) -> str:
    """POST /v22.0/{post_id}/comments → returns comment_id."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"https://graph.facebook.com/v22.0/{post_id}/comments",
            data={"message": message, "access_token": page_token},
        )
        resp.raise_for_status()
        return resp.json()["id"]
```

---

## Webhook subscribe update

Edit `app/api/v1/webhooks.py`:

```python
# Existing:
ALLOWED_FIELDS = {"messages", "messaging_postbacks"}
# New:
ALLOWED_FIELDS = {"messages", "messaging_postbacks", "feed", "mentions"}

# Handler dispatch:
if field == "feed" or field == "mentions":
    await proactive_reply_service.handle_feed_event(event, db)
```

Cần re-subscribe Page App qua FB Dashboard hoặc API:
```bash
curl -X POST "https://graph.facebook.com/v22.0/{page_id}/subscribed_apps" \
  -d "subscribed_fields=messages,messaging_postbacks,feed,mentions&access_token={page_token}"
```

---

## DM escalation flow

### `app/services/dm_escalation_service.py`

```python
async def handle_comment_reply(event: dict, db: AsyncSession) -> None:
    """When webhook delivers feed verb=add item=comment with parent_id matching our comment."""
    parent_id = event.get("parent_id")
    thread = await get_comment_thread_by_comment_id(db, parent_id)
    if not thread:
        return  # not our comment

    psid = event["from"]["id"]
    thread.poster_psid = psid
    thread.poster_replied_at = datetime.now(timezone.utc)

    # Check 24h messaging window
    last_inbound = await get_last_inbound_message(db, psid)
    if last_inbound and (now - last_inbound.created_at) < timedelta(hours=24):
        dm_text = f"Chào anh/chị! Bên DHTC vừa thấy anh/chị reply comment, mời anh/chị cho shop biết thêm để hỗ trợ ạ 🌿"
        try:
            await send_messenger_message(psid, dm_text, settings.FACEBOOK_PAGE_ACCESS_TOKEN)
            thread.dm_sent_at = now
            thread.dm_status = "sent"
            await db.add(ChatMessage(
                session_id=f"escalation-{thread.id}",
                fb_user_id=psid, direction="outbound",
                platform="messenger", content=dm_text,
            ))
        except httpx.HTTPError as e:
            thread.dm_status = f"error: {e}"
    else:
        thread.dm_status = "window_expired"

    await db.commit()
```

---

## API contract (admin)

### `GET /api/v1/admin/proactive/replies?intent=&status=&from_date=&to_date=&limit=50`

```json
[{
  "id": 42, "post_id": "123_456", "post_url": "https://facebook.com/...",
  "post_text": "Vừa ghé DHTC...", "intent": "checkin",
  "template_used": "checkin_v2", "reply_text": "Cảm ơn...",
  "status": "sent", "created_at": "..."
}]
```

### `PATCH /api/v1/admin/proactive/templates/{intent}`

```json
// Request
{"is_enabled": false}
// Response
{"intent": "complaint", "is_enabled": false, "updated_at": "..."}
```

---

## Frontend

New subpage `frontend/src/pages/admin/AdminProactiveReply.tsx`:
- 5 toggle cards per intent (enabled/disabled, last 24h count, template preview)
- Audit log table với filter
- Banner trên cùng: warning nếu `PROACTIVE_REPLY_ENABLED=false` ("Đang chạy chế độ dry-run")
- Banner nếu rate limit chạm trần ("Đã reply 50/50 hôm nay")

Route: `/admin/proactive-reply`, nav link trong Admin sidebar.

---

## Test strategy

1. Unit: `classify_post_intent` matrix — 20 fixture cases
2. Unit: `pick_template` returns valid variant
3. Unit: `handle_feed_event` mocked DB + httpx — dedup, rate limit, cooldown, dry-run paths
4. Integration: webhook POST feed event → assert proactive_replies row + comment_threads row created
5. Integration: webhook POST comment reply event → assert DM sent (mock messenger API) or window_expired
6. Endpoint: `GET /admin/proactive/replies` filter test
7. Frontend: snapshot AdminProactiveReply tab với mock audit data
