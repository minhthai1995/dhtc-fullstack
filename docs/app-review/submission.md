# Meta App Review — Submission Document

**App**: DHTC Đà Nẵng — Chợ Đêm Sơn Trà CRM
**Business**: Công ty TNHH DHTC Đà Nẵng (giấy phép kinh doanh đính kèm)
**Website**: https://dhtcdanang.com
**Page chính thức**: https://www.facebook.com/NightMarketSonTraDaNangVietNam/
**Use case tổng quát**: Internal CRM cho 1 Facebook Page duy nhất (Page của chính doanh nghiệp DHTC) — KHÔNG phải multi-tenant SaaS, KHÔNG bán lại cho khách hàng khác.

---

## Tổng quan use case

Chợ Đêm Sơn Trà (DHTC) là điểm đến du lịch lớn nhất Đà Nẵng, mỗi tối có 200-500 khách check-in lên Facebook tagging Page chính thức. Hiện tại staff phải:

1. Thủ công theo dõi comment/check-in posts mention Page (mất 6-8 giờ/ngày)
2. Trả lời comment cảm ơn từng người
3. Khi khách hỏi voucher/khuyến mãi qua DM → phản hồi trong giờ vàng 24h

Ứng dụng DHTC CRM tự động hoá 3 bước trên cho **Page sở hữu của chính doanh nghiệp**, không phải dịch vụ multi-tenant. Toàn bộ comment/DM được phân loại intent (check-in, khen, phàn nàn, hỏi hàng) và staff duyệt template trước khi gửi.

---

## Permissions Requested (5)

### 1. `pages_show_list`

**Why we need it**: Sau khi admin DHTC đăng nhập Facebook OAuth, app cần list các Pages user là admin để xác nhận chọn đúng Page "Chợ Đêm Sơn Trà — Wonders Night Market". Không dùng để liệt kê Pages cho user khác — chỉ là bước onboarding 1 lần.

**Where in the app**: `/admin/settings/fb-connect` → sau OAuth callback, app gọi `GET /v22.0/me/accounts` → hiển thị dropdown để admin chọn Page → lưu `page_id` + `page_access_token` vào `app_settings` table.

**Without this permission**: Admin phải copy-paste `page_id` thủ công từ Facebook → dễ sai → không xác thực được Page nào thật sự thuộc user.

---

### 2. `pages_read_engagement`

**Why we need it**: Đo lường engagement của Page (số check-in/comment/like mỗi ngày) để hiển thị dashboard cho chủ DHTC: "Hôm qua có 312 check-in, 87 comment, 23 DM". Phục vụ quyết định kinh doanh (giờ vàng, nhân sự CSKH).

**Where in the app**: `/admin/dashboard` → biểu đồ engagement 7/30 ngày. Backend cron mỗi 15 phút gọi `GET /v22.0/{page-id}/insights?metric=page_impressions,page_post_engagements`.

**Without this permission**: Không có dữ liệu thật để tối ưu vận hành; phải đoán mò giờ cao điểm.

---

### 3. `pages_read_user_content`

**Why we need it**: Đọc các **post + comment do người dùng tạo có tag/check-in Page** để phát hiện khách hàng vừa ghé chợ. Đây là tín hiệu duy nhất biết "ai vừa đến" mà chưa có phone/email. Sau khi đọc, app phân loại intent (check-in / khen / phàn nàn / hỏi) bằng keyword classifier nội bộ.

**Where in the app**: Webhook subscription `feed` field → mỗi check-in/comment mới fires webhook → backend lưu vào `fb_posts`/`fb_comments` table → CRM hiển thị cho staff duyệt template trả lời.

**Without this permission**: Không thể biết khách vừa check-in để cảm ơn/tặng voucher → mất 100% cơ hội retention từ check-in traffic.

---

### 4. `pages_manage_engagement`

**Why we need it**: Trả lời comment dưới post check-in với template đã được admin duyệt sẵn (mỗi intent có 3-5 template, kèm rate limit 50 reply/Page/ngày để tránh spam). Tin nhắn reply mang lure m.me để khách chủ động vào Messenger → tuân thủ Meta 24h Policy.

**Template ví dụ** (intent = check-in):
> "Cảm ơn anh/chị đã ghé Chợ Đêm Sơn Trà tối nay! 🎁 Inbox shop nhận voucher 50K cho lần ghé tiếp theo nhé → m.me/NightMarketSonTraDaNangVietNam"

**Where in the app**: `/admin/proactive/queue` → staff click "Approve" → backend POST `/v22.0/{post-id}/comments` với template tương ứng intent. Kill switch `PROACTIVE_REPLY_ENABLED=false` trong env để tắt khẩn cấp.

**Without this permission**: Staff phải comment thủ công từng người → không scale, mất 4-6 giờ/đêm.

---

### 5. `pages_messaging`

**Why we need it**: Khi khách hàng click vào lure m.me và **gửi tin nhắn trước cho Page** (mở 24h messaging window), app gửi voucher kèm hướng dẫn đổi qua Messenger DM. **Không cold-DM** — chỉ phản hồi trong cửa sổ 24h.

**Compliance với Meta 24h Policy**:
- App chỉ gọi `POST /v22.0/me/messages` khi `last_user_message_timestamp` < 24h
- Backend kiểm tra timestamp trước mỗi lần gửi
- Nếu quá 24h → không gửi, hiển thị "Window expired" trong UI staff

**Where in the app**: `/admin/crm/conversations` → tab "Trong 24h" → staff click "Send voucher" → backend kiểm tra window → POST messages API.

**Without this permission**: Khách click m.me, gửi tin "shop ơi" nhưng không nhận được voucher → mất khách + ấn tượng xấu.

---

## Data Use & Privacy

- **Storage**: Toàn bộ FB tokens lưu encrypted (AES-256) trong PostgreSQL, chỉ backend có khoá. Không log token ra stdout/file.
- **Retention**: User content (comment/post) lưu 90 ngày để training intent classifier; sau đó xoá bản raw, giữ aggregated metrics.
- **Sharing**: Không share dữ liệu với bên thứ 3. Không bán dữ liệu.
- **User deletion**: Có endpoint `DELETE /api/v1/admin/user-data/{fb_user_id}` xoá toàn bộ message + comment của 1 user theo yêu cầu (data deletion callback ở `/api/v1/meta/data-deletion`).
- **Privacy Policy**: https://dhtcdanang.com/privacy
- **Terms of Service**: https://dhtcdanang.com/terms

---

## Test User & Demo Instructions

Xem chi tiết tại `test-user-setup.md`. Tóm tắt:
- Reviewer dùng FB Test User (đã share trong Meta dashboard)
- Đăng nhập tại `https://dhtcdanang.com/admin/login` với:
  - Email: `reviewer@dhtcdanang.com`
  - Password: (set trong Meta Dashboard → App Roles → Testers)
- Screencast 5 phút demo end-to-end tại `screencast-script.md`

---

## Submission Checklist

- [ ] Business Verification hoàn tất (xem `business-verification-checklist.md`)
- [ ] App icon 1024x1024 uploaded
- [ ] Privacy Policy URL live: https://dhtcdanang.com/privacy
- [ ] Terms of Service URL live: https://dhtcdanang.com/terms
- [ ] Data Deletion callback URL live: https://api.dhtcdanang.com/api/v1/meta/data-deletion
- [ ] App Domain whitelisted: dhtcdanang.com
- [ ] Valid OAuth Redirect URI: https://dhtcdanang.com/auth/fb/callback
- [ ] Screencast uploaded cho mỗi permission (5 video hoặc 1 video coverage tất cả)
- [ ] Test user credentials gửi qua review form
- [ ] Use case description copy từ document này sang Meta App Dashboard

---

## Liên hệ

- **Technical contact**: tech@dhtcdanang.com
- **Business contact**: contact@dhtcdanang.com
- **Phone**: (đính kèm trong giấy phép kinh doanh)
