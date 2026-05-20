# Requirements — Feature: Page Tracking (P2)

**Version:** 0.1 (DRAFT — chờ review)
**Status:** 📝 Drafting
**Last updated:** 2026-05-20

---

## Mô tả

Triển khai hệ thống theo dõi hành vi người dùng trên dhtc.vn (pixel tracking) để
điền data thực cho tab "Hành vi" của `/admin/crm` — hiện đang là placeholder
empty state "Cần page tracking (P2)".

Phạm vi MVP: chỉ track page views (không click/scroll heatmap). Visitor_id qua
`localStorage` (không cookie, không consent banner ở MVP — sẽ add ở P3 khi có
khách EU/quốc tế).

---

## Người dùng mục tiêu

- **Admin:** Xem tab "Hành vi" với data thực — funnel conversion, top pages, device, source, hourly traffic
- **End user (visitor):** Không thấy gì — pixel chạy silent, không yêu cầu opt-in ở MVP

---

## Yêu cầu nghiệp vụ

### Phải có (Must have)

- [ ] Mọi page view trên SPA (`/`, `/shop`, `/product/:slug`, `/checkout`, `/orders/:id`, ...) được gửi về BE
- [ ] Mỗi visitor có `visitor_id` duy nhất (UUID v4 lưu `localStorage`, persist cross-session)
- [ ] Nếu user đã login → page_view link với `user_id`
- [ ] BE lưu page view (visitor_id, user_id, session_id, path, referrer, user_agent, viewed_at)
- [ ] Tab "Hành vi" hiển thị data thực:
  - 4 KPI: total sessions hôm nay, bounce rate, avg duration, pages/session
  - Theo device (mobile/desktop/tablet derive từ user_agent)
  - Theo source (direct/google/facebook/referrer derive)
  - Top 10 pages (count grouped by path)
  - Funnel: View product → Add to cart → Checkout → Complete (cross-join với orders + cart events)
  - 24h hourly chart (sessions per hour, hôm nay)
  - Session table: visitor_id, page count, duration, last seen

### Không làm trong MVP (Out of scope)

- ❌ Click tracking, scroll depth, heatmap
- ❌ Consent banner / GDPR opt-in (P3)
- ❌ A/B testing infrastructure
- ❌ Session replay (Hotjar-style)
- ❌ Cross-device user stitching
- ❌ Bot detection / filter (chỉ filter bằng User-Agent regex đơn giản)
- ❌ Real-time dashboard (data lag ≤ 1 phút OK)

---

## Ràng buộc kỹ thuật & bảo mật

- POST `/tracking/page-view` **public** (no auth) — vì visitor chưa login cũng phải track được
- Endpoint phải rate-limit cấp visitor_id (max 60 req/phút) — chặn abuse
- KHÔNG log IP raw — chỉ derive country_code (qua header `CF-IPCountry` hoặc geo lib)
- KHÔNG track admin/seller portal — chỉ track customer-facing routes (`/shop/*`, `/product/*`, `/cart`, `/checkout`, `/orders/*`)
- visitor_id ≠ user_id — sống ở localStorage, có thể bị clear → chấp nhận
- Bảng `page_views` có thể grow nhanh → index `(viewed_at, path)` + plan archive sau 90 ngày (P3)

---

## Tiêu chí chấp nhận (Acceptance criteria)

```
GIVEN visitor mới truy cập /shop
WHEN load page xong
THEN POST /api/v1/tracking/page-view với visitor_id + path="/shop"
AND BE trả về 204
AND row mới xuất hiện trong page_views table

GIVEN visitor đã có visitor_id trong localStorage
WHEN reload trang
THEN visitor_id giữ nguyên (không tạo mới)

GIVEN user đã đăng nhập + có visitor_id
WHEN POST /tracking/page-view
THEN page_views.user_id được điền (derive từ JWT nếu Bearer có), KHÔNG yêu cầu auth

GIVEN admin token
WHEN GET /admin/behavior/overview
THEN trả về { stats, by_device, by_source, top_pages, funnel, hourly_24h, sessions }

GIVEN không có admin token
WHEN GET /admin/behavior/overview
THEN trả về 401

GIVEN spam request từ cùng 1 visitor_id (>60/phút)
WHEN POST /tracking/page-view request thứ 61
THEN trả về 429 Too Many Requests
```
