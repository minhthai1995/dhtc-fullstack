# Design — Feature: Page Tracking (P2)

**Version:** 0.1 (DRAFT — chờ review)
**Status:** 📝 Drafting
**Last updated:** 2026-05-20

---

## API Endpoints

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/api/v1/tracking/page-view` | optional Bearer | `PageViewIn` | `204 No Content` |
| GET  | `/api/v1/admin/behavior/overview` | ✅ admin | query: `?date=YYYY-MM-DD` (default today) | `BehaviorOverview` 200 |
| GET  | `/api/v1/admin/behavior/sessions` | ✅ admin | `?limit=50&offset=0` | `list[SessionSummary]` 200 |

---

## Schema DB — bảng mới `page_views`

```sql
CREATE TABLE page_views (
    id           SERIAL PRIMARY KEY,
    visitor_id   VARCHAR(36) NOT NULL,           -- UUID v4 từ FE localStorage
    session_id   VARCHAR(36) NOT NULL,           -- UUID v4, tạo mới sau 30' idle
    user_id      INTEGER REFERENCES users(id),   -- nullable (visitor chưa login)
    path         VARCHAR(500) NOT NULL,          -- ví dụ "/product/dac-san-cha-bo"
    referrer     VARCHAR(500),                   -- nullable
    user_agent   VARCHAR(500),                   -- nullable, dùng để derive device
    country_code VARCHAR(2),                     -- 'VN', 'US', ... nullable
    viewed_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_page_views_viewed_at ON page_views(viewed_at);
CREATE INDEX ix_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX ix_page_views_session_id ON page_views(session_id);
CREATE INDEX ix_page_views_user_id ON page_views(user_id);
CREATE INDEX ix_page_views_viewed_at_path ON page_views(viewed_at, path);
```

Migration: `backend/alembic/versions/2026_05_20_XXXX_add_page_views.py`

---

## Pydantic schemas

```python
# schemas/tracking.py
class PageViewIn(BaseModel):
    visitor_id: str          # UUID v4 from FE
    session_id: str          # UUID v4 from FE
    path: str
    referrer: str | None = None
    # user_agent + country_code derive ở BE từ headers

# schemas/admin_behavior.py
class BehaviorStats(BaseModel):
    total_sessions: int
    bounce_rate: float | None      # % sessions có ≤1 page view
    avg_duration_sec: float | None
    pages_per_session: float | None

class DeviceBucket(BaseModel):
    key: Literal["mobile", "desktop", "tablet", "unknown"]
    count: int

class SourceBucket(BaseModel):
    key: Literal["direct", "google", "facebook", "other"]
    count: int

class TopPage(BaseModel):
    path: str
    count: int

class BehaviorFunnelStage(BaseModel):
    key: Literal["view_product", "add_to_cart", "checkout", "complete"]
    count: int

class HourlyBucket(BaseModel):
    hour: int            # 0..23
    count: int

class SessionSummary(BaseModel):
    session_id: str
    visitor_id: str
    user_id: int | None
    page_count: int
    duration_sec: int
    first_seen: datetime
    last_seen: datetime

class BehaviorOverview(BaseModel):
    stats: BehaviorStats
    by_device: list[DeviceBucket]
    by_source: list[SourceBucket]
    top_pages: list[TopPage]
    funnel: list[BehaviorFunnelStage]
    hourly_24h: list[HourlyBucket]
```

---

## Flow kỹ thuật

### Tracking (FE → BE)

```
SPA route change (React Router event)
  → useTracking() hook fires
  → load/create visitor_id từ localStorage (key: "dhtc_visitor_id")
  → load/create session_id từ sessionStorage (key: "dhtc_session_id", reset sau 30' idle)
  → POST /api/v1/tracking/page-view { visitor_id, session_id, path, referrer }
  → fire-and-forget (không await, không block render)
  → on error: silent fail (KHÔNG log to console, KHÔNG show user)
```

### Tracking (BE)

```
POST /tracking/page-view
  → rate-limit check (Redis hoặc in-memory) — max 60/min per visitor_id
  → 429 nếu vượt
  → parse User-Agent → derive device_type
  → parse Country từ header `X-Country-Code` hoặc Cloudflare `CF-IPCountry` (nếu có)
  → optional: nếu Authorization Bearer → decode → set user_id
  → insert page_views row
  → return 204
```

### Admin behavior aggregation

```
GET /admin/behavior/overview?date=YYYY-MM-DD
  → require_admin
  → stats: count distinct session_id WHERE viewed_at::date = ?
  → bounce_rate: sessions có count=1 / total_sessions
  → avg_duration: AVG(MAX(viewed_at) - MIN(viewed_at)) grouped by session_id
  → pages_per_session: AVG(count per session_id)
  → by_device: GROUP BY device_type (derived inline from user_agent regex)
  → by_source: regex referrer → ('google.com' → google, 'facebook.com' → facebook, NULL → direct, else → other)
  → top_pages: GROUP BY path ORDER BY count DESC LIMIT 10
  → funnel:
      view_product: count distinct visitor_id WHERE path LIKE '/product/%'
      add_to_cart: count distinct user_id từ CartItem joined visitor_id qua user_id
      checkout: count distinct visitor_id WHERE path LIKE '/checkout%'
      complete: count distinct customer_id từ Order WHERE created_at::date = ? AND status != cancelled
  → hourly_24h: GROUP BY EXTRACT(HOUR FROM viewed_at)
  → return BehaviorOverview
```

---

## Cấu trúc file

```
backend/app/
├── api/v1/tracking.py            → POST /tracking/page-view (NEW)
├── api/v1/admin.py               → GET /admin/behavior/overview, /sessions (APPEND)
├── crud/page_view.py             → create, get_for_date, aggregate_* (NEW)
├── models/page_view.py           → PageView SQLAlchemy model (NEW)
├── schemas/tracking.py           → PageViewIn (NEW)
├── schemas/admin_behavior.py     → BehaviorOverview + sub-schemas (NEW)
├── services/tracking.py          → derive_device, derive_source, derive_country (NEW)
└── alembic/versions/…add_page_views.py (NEW)

frontend/src/
├── features/tracking/
│   ├── tracking.api.ts           → sendPageView() (NEW)
│   ├── visitor.ts                → getVisitorId(), getSessionId(), resetSessionIfIdle() (NEW)
│   └── useTracking.ts            → useTracking() hook gắn vào AppLayout (NEW)
├── components/layout/CustomerLayout.tsx  → wrap useTracking() (EDIT)
└── pages/admin/AdminCRM.tsx      → BehaviorTab bind data thực, bỏ empty state (EDIT)
```

---

## Helper logic

```python
# services/tracking.py
def derive_device(user_agent: str | None) -> str:
    if not user_agent: return "unknown"
    ua = user_agent.lower()
    if any(x in ua for x in ("ipad", "tablet")): return "tablet"
    if any(x in ua for x in ("mobile", "iphone", "android")): return "mobile"
    return "desktop"

def derive_source(referrer: str | None) -> str:
    if not referrer: return "direct"
    if "google." in referrer: return "google"
    if "facebook." in referrer or "fb." in referrer: return "facebook"
    return "other"
```

---

## Quyết định thiết kế

| Quyết định | Lý do |
|-----------|-------|
| visitor_id ở localStorage (không cookie) | Đơn giản, không cần consent banner cho MVP; trade-off: clear cache → mất identity |
| session_id ở sessionStorage + 30' idle reset | Browser tự clear khi đóng tab; logic idle reset đặt ở FE để tránh DB write |
| Tracking endpoint public, không bắt buộc auth | Visitor chưa login phải track được; nếu Bearer có thì decode optional |
| Rate-limit 60/min per visitor_id | Đủ cho real user (SPA navigate, mỗi click ~1 view); chặn bot/abuse |
| Device derive bằng UA regex inline | Không cần thư viện ua-parser (overhead) — 3 case đủ MVP |
| Country derive bằng header (Cloudflare) | Geo lib (geoip2) tốn memory + cần data file; CF header miễn phí nếu dùng |
| Funnel join với orders/cart hiện có | Tận dụng data có sẵn, không cần "event" table riêng |
| KHÔNG dùng external analytics (GA/Plausible) | Self-host = privacy + control + đã có 90% infra |
| Index `(viewed_at, path)` composite | Query top_pages filter by date phổ biến nhất |

---

## Performance & Scale

- Volume estimate: 1k visitors/day × 10 pageviews/visitor = 10k rows/day = ~300k/tháng
- Postgres handle thoải mái cho 1-2 năm với index hợp lý
- P3: nếu vượt 10M rows → partition by `viewed_at` quarterly, archive >90 ngày sang S3
- Aggregation query trên `WHERE viewed_at::date = today` — index `viewed_at` cover
- KHÔNG cần materialized view ở MVP (data nhỏ, query <100ms)

---

## Privacy & Compliance (note for P3)

- MVP: collect visitor_id (random UUID, không PII), user_id (đã có consent qua đăng ký), path, referrer, country_code
- KHÔNG collect: IP raw, fingerprint, screen size, cookie cross-domain
- Nếu mở rộng EU → cần consent banner + IP anonymization + data export/delete API
