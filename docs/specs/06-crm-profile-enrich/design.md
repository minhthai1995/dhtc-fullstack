# Design — Feature: P5C-enrich · CRM Profile Enrichment

**Version:** 0.1 (draft)
**Status:** 🔴 Draft — chờ duyệt
**Last updated:** 2026-05-21

---

## Architecture overview

```
Webhook event (PSID lần đầu)
  ↓
[BackgroundTasks] FBGraphService.fetch_profile(psid)
  ↓
GET graph.facebook.com/v22.0/{psid}?fields=...&access_token=<page_token>
  ↓
UPSERT fb_profiles ON CONFLICT (messenger_psid) DO UPDATE SET messenger_* = EXCLUDED.*
  ↓
(CRM endpoint sau này JOIN fb_profiles + chat_messages qua messenger_psid)
```

---

## Schema DB

### Option chosen: extend `fb_profiles` (revised 2026-05-21)

Lý do EXTEND thay vì tạo bảng riêng:
- `fb_profiles` đã có cột `messenger_psid VARCHAR(64) UNIQUE NULLABLE` reserved cho P5C khi làm P5A (xem handoff `2026-05-20`).
- 1 user thực tế có thể có cả OAuth login + Messenger chat → cùng 1 row, vẫn link được qua `messenger_psid` post-hoc.
- Tránh duplicate columns (`name`, `profile_pic_url`, `locale`) giữa 2 bảng.
- Chỉ cần: make `user_id` nullable (anonymous PSID-only rows) + add messenger cache fields.

```sql
-- Migration: extend_fb_profiles_messenger_cache
ALTER TABLE fb_profiles
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN fb_app_user_id DROP NOT NULL,        -- PSID-only rows have no FBID
  ADD COLUMN page_id VARCHAR(64),                   -- multi-page support
  ADD COLUMN messenger_name VARCHAR(255),
  ADD COLUMN messenger_pic_url VARCHAR(1024),
  ADD COLUMN messenger_age_range_min INTEGER,       -- {min, max} from Graph
  ADD COLUMN messenger_age_range_max INTEGER,
  ADD COLUMN messenger_gender VARCHAR(16),          -- 'male'|'female'|'unknown'
  ADD COLUMN messenger_locale VARCHAR(16),          -- deprecated by Meta but try
  ADD COLUMN messenger_fetched_at TIMESTAMPTZ,
  ADD COLUMN messenger_status VARCHAR(32) DEFAULT 'active',  -- 'active'|'opted_out'|'error'
  ADD COLUMN messenger_error_message TEXT;

CREATE INDEX fb_profiles_page_id_idx ON fb_profiles(page_id);
CREATE INDEX fb_profiles_messenger_fetched_at_idx ON fb_profiles(messenger_fetched_at);
```

Row pattern matrix:
- **OAuth-only:** `user_id` NOT NULL, `fb_app_user_id` NOT NULL, `messenger_psid` NULL, `messenger_*` NULL
- **Messenger-only (anonymous):** `user_id` NULL, `fb_app_user_id` NULL, `messenger_psid` NOT NULL, `messenger_*` from Graph
- **Linked (both):** all populated

### Log table cho debug

```sql
CREATE TABLE fb_graph_call_log (
  id SERIAL PRIMARY KEY,
  psid VARCHAR(64) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  http_status INTEGER,
  error_code INTEGER,                          -- Meta error code (vd 190 = invalid token)
  error_subcode INTEGER,
  duration_ms INTEGER,
  called_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX fb_graph_call_log_psid_idx ON fb_graph_call_log(psid);
CREATE INDEX fb_graph_call_log_called_at_idx ON fb_graph_call_log(called_at);
```

---

## Service layer

### `app/services/fb_graph_service.py` (mới)

```python
async def fetch_messenger_profile(
    psid: str,
    page_token: str,
    db: AsyncSession,
) -> FBProfile:  # extended fb_profiles row, messenger_* fields populated
    """
    Idempotent: nếu cache còn fresh (≤30 ngày) → return cached.
    Nếu stale/missing → call Graph, UPSERT, return new row.
    """
    cached = await get_by_psid(db, psid)
    if cached and cached.messenger_fetched_at and (now() - cached.messenger_fetched_at) < timedelta(days=30):
        return cached

    async with httpx.AsyncClient(timeout=5.0) as client:
        url = f"https://graph.facebook.com/v22.0/{psid}"
        params = {
            "fields": "id,name,picture.width(200),age_range,gender,locale",
            "access_token": page_token,
        }
        start = time.monotonic()
        try:
            resp = await client.get(url, params=params)
            data = resp.json()
            duration_ms = int((time.monotonic() - start) * 1000)

            await log_graph_call(db, psid, url, resp.status_code, data, duration_ms)

            if resp.status_code != 200:
                return await upsert_error(db, psid, data.get("error", {}))

            return await upsert_profile(db, psid, data)
        except httpx.TimeoutException:
            await log_graph_call(db, psid, url, 0, {"error": "timeout"}, 5000)
            raise
```

### Background task wiring (webhook handler)

`app/api/v1/webhooks.py` — sau khi save inbound message:

```python
# Existing: db.add(ChatMessage(...))
# New:
existing = await get_fb_profile_by_psid(db, sender_psid)
if not existing or not existing.messenger_fetched_at or (now() - existing.messenger_fetched_at) > timedelta(days=30):
    background_tasks.add_task(
        fetch_messenger_profile_safe,  # wraps fetch_messenger_profile + catches all exceptions
        psid=sender_psid,
        page_token=settings.FACEBOOK_PAGE_ACCESS_TOKEN,
    )
```

`fetch_messenger_profile_safe` mở session DB riêng (background tasks không share session với request).

---

## Derive logic

### `app/services/customer_derive.py` (mới)

```python
VN_CITY_KEYWORDS = ["hà nội", "tp.hcm", "đà nẵng", "hải phòng", "cần thơ", ...]  # 30+ tỉnh

async def derive_country(db: AsyncSession, user_id: int | None, psid: str) -> str | None:
    """'VN' | 'OTHER' | None — derive từ shipping_address của orders hoặc captured_address chat."""
    if user_id:
        addresses = await get_order_shipping_addresses(db, user_id)
    else:
        addresses = await get_captured_addresses_by_psid(db, psid)

    if not addresses:
        return None

    for addr in addresses:
        text = json.dumps(addr).lower() if isinstance(addr, dict) else str(addr).lower()
        if any(city in text for city in VN_CITY_KEYWORDS) or "vietnam" in text or "vn" in text:
            return "VN"
    return "OTHER"


async def derive_language(db: AsyncSession, psid: str) -> str | None:
    """'vi' | 'en' | 'mixed' | None — đếm character distribution trong chat content."""
    msgs = await get_inbound_messages_by_psid(db, psid, limit=20)
    if not msgs:
        return None
    text = " ".join(m.content for m in msgs)
    vi_chars = sum(1 for c in text if c in "ăâđêôơưĂÂĐÊÔƠƯáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ")
    total = len(text)
    ratio = vi_chars / total if total else 0
    if ratio > 0.05:
        return "vi"
    if ratio > 0.01:
        return "mixed"
    return "en"


BIRTHDAY_PATTERNS = [
    r"sinh năm (\d{4})",
    r"sinh ngày (\d{1,2})[/\-\.](\d{1,2})(?:[/\-\.](\d{2,4}))?",
    r"(\d{1,2})/(\d{1,2})/(\d{4}) là sinh nhật",
]

async def extract_declared_birthday(db: AsyncSession, psid: str) -> str | None:
    """Regex scan inbound messages cho user-declared DOB. Trả ISO date hoặc 'YYYY' nếu chỉ có năm."""
    msgs = await get_inbound_messages_by_psid(db, psid, limit=100)
    for m in msgs:
        for pat in BIRTHDAY_PATTERNS:
            if match := re.search(pat, m.content, re.IGNORECASE):
                return _normalize_birthday(match.groups())
    return None
```

---

## API contract

### `GET /api/v1/admin/crm/conversations`

**Before:**
```json
[{"fb_user_id": "1234567890", "session_id": "...", "message_count": 5, ...}]
```

**After:**
```json
[{
  "fb_user_id": "1234567890",
  "session_id": "...",
  "message_count": 5,
  "last_activity": "2026-05-21T08:32:14Z",
  "last_message": "cảm ơn shop",
  "profile": {
    "fb_name": "Nguyễn Văn A",
    "fb_avatar_url": "https://scontent...",
    "age_range": "25-34",
    "gender": "male",
    "derived_country": "VN",
    "derived_lang": "vi",
    "declared_birthday": null,
    "fetched_at": "2026-05-20T14:00:00Z",
    "status": "active"
  }
}]
```

Profile = null khi PSID chưa được Graph-fetched (race: webhook fire → response trả về trước khi background task xong).

### `GET /api/v1/admin/crm/conversations/{session_id}/profile`

Đã có trong CRM plan trước. Spec này extend payload thêm các derived fields.

---

## Frontend changes

File: `frontend/src/pages/admin/AdminCRM.tsx` — `CustomersTab`

Cột table (replace):
```tsx
<th>Khách hàng</th>      // avatar + name + small PSID
<th>Tuổi</th>             // age_range
<th>Giới tính</th>        // gender với icon
<th>Quốc gia</th>         // flag emoji 🇻🇳 / 🌍 / —
<th>Ngôn ngữ chat</th>    // 'vi' / 'en' / 'mixed' / —
<th>Sinh nhật</th>        // declared_birthday hoặc —
<th>Last seen</th>        // relative time
```

Component mới `<ProfileCell />`:
```tsx
function ProfileCell({ profile }: { profile: ConversationProfile | null }) {
  if (!profile) return <span className="text-ink-mute italic">Đang đồng bộ…</span>;
  if (profile.status === 'opted_out') return <span>🔒 Privacy-protected</span>;
  return (
    <div className="flex items-center gap-2">
      <img src={profile.fb_avatar_url} className="w-8 h-8 rounded-full" />
      <div>
        <div className="font-medium">{profile.fb_name}</div>
        <div className="text-[10px] text-ink-mute font-mono">{profile.psid.slice(0, 8)}…</div>
      </div>
    </div>
  );
}
```

Empty state pattern: `<span className="text-ink-mute italic">—</span>` cho field null.

---

## Sequence: lần đầu PSID đến

```
1. FB webhook POST /webhook/facebook  (existing)
2. handler save ChatMessage         (existing)
3. handler check: messenger_profiles WHERE psid=X  → empty
4. handler add background task fetch_messenger_profile(X, page_token)
5. handler respond 200 OK to FB     (within 5s SLA)
6. [background] httpx GET graph.facebook.com/v22.0/X?fields=...
7. [background] log fb_graph_call_log row
8. [background] UPSERT messenger_profiles row
9. Admin opens /admin/crm 30s sau   → JOIN có data
```

Race window khoảng 1-3s — admin có thể thấy "Đang đồng bộ…" rồi refresh lại.

---

## Test strategy

1. Unit: `fetch_messenger_profile` mocked httpx — assert UPSERT, cache hit/miss, error path
2. Unit: `derive_country/language/extract_declared_birthday` — fixture data
3. Integration: webhook POST với PSID mới → assert messenger_profiles row created (sau khi await background tasks)
4. Endpoint: `GET /admin/crm/conversations` → assert payload contains `profile` key
5. Frontend: snapshot CustomersTab render với mock data có/không profile
