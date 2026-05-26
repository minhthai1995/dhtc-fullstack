# Test User Setup — Meta App Review

Meta reviewer cần một test user và một test Page để verify cả 5 permissions mà không động vào dữ liệu production. Tài liệu này hướng dẫn tạo + bàn giao.

---

## 1. Tạo Test User

Meta App Dashboard → **Roles** → **Test Users** → **Add**.

**Chọn settings**:
- Name: "Meta Reviewer DHTC"
- Authorized: All permissions in App
- App-installed: yes (auto-install với consent đầy đủ)

**Lưu output**:
- Test User Email (Meta tự sinh: `xxx@tfbnw.net`)
- Test User Password (Meta tự sinh)
- Test User Profile URL

→ Lưu vào Meta App Dashboard → **App Review** → **Test User Credentials**.

---

## 2. Tạo Test Page

Login vào FB bằng Test User credentials → tạo Page:
- Tên: **DHTC Test — Review Only**
- Category: Local Business → Restaurant / Cafe
- Cover photo: dùng tạm cover của Page chính
- Mô tả: "Test Page for Meta App Review of DHTC CRM app. Do not interact."

→ Sau khi tạo, vào **Page Settings** → **Page Roles** → assign Test User là **Admin**.

---

## 3. Seed dữ liệu mẫu trên Test Page

Reviewer cần thấy có check-in/comment thật để demo end-to-end. Tạo seed:

**Post mẫu (Test User tự đăng)**:
1. Check-in post: "Vừa đến DHTC tối nay, không khí cực vui! 🎉" + tag location
2. Praise comment: "Đồ ăn ngon, nhân viên thân thiện 👍"
3. Question comment: "Cho hỏi giờ mở cửa cuối tuần với ạ?"
4. Complaint comment: "Hôm qua xếp hàng lâu quá ạ 😞"

→ App sẽ phát hiện 4 intent khác nhau trong screencast.

**Lưu ý**: Mỗi post phải reviewer là tác giả (Test User), KHÔNG dùng dữ liệu của user thật. Nếu dùng user thật → vi phạm Platform Policy.

---

## 4. Tạo admin account DHTC cho reviewer

Trong backend production:

```bash
# Trong môi trường staging (KHÔNG production)
docker exec -it dhtc-api python -m app.scripts.create_admin \
  --email reviewer@dhtcdanang.com \
  --password '<random-strong-password>' \
  --role admin \
  --note 'Meta App Review temporary access — expires 2026-XX-XX'
```

→ Lưu credentials vào Meta App Dashboard → **App Review** → **Instructions for Reviewer**.

→ Set hạn 30 ngày trong DB:
```sql
UPDATE admin_users 
SET expires_at = NOW() + INTERVAL '30 days'
WHERE email = 'reviewer@dhtcdanang.com';
```

Sau khi review xong → DELETE account.

---

## 5. Connect Test Page với Test User account trong app

Reviewer flow lúc test:

1. Mở https://dhtcdanang.com/admin/login
2. Login bằng `reviewer@dhtcdanang.com`
3. `/admin/settings/fb-connect` → click "Connect Facebook"
4. Popup OAuth → login bằng **Test User credentials** (không phải admin email)
5. Consent screen list 5 permissions → reviewer approve
6. Dropdown list Pages → reviewer chọn **"DHTC Test — Review Only"**
7. Confirm → app saved Page ID + Page Access Token

---

## 6. Webhook subscription for Test Page

Vào Meta App Dashboard → **Webhooks** → **Page** → **Subscribe to**:
- `feed` (cho check-in posts + comments)
- `messages` (cho DM)
- `messaging_postbacks` (cho m.me clicks)

Callback URL: `https://api.dhtcdanang.com/api/v1/meta/webhook`
Verify token: (giá trị trong `META_WEBHOOK_VERIFY_TOKEN` env)

→ Subscribe Test Page vào webhook qua `POST /v22.0/{test-page-id}/subscribed_apps`.

---

## 7. Bàn giao cho Meta reviewer

Trong Meta App Dashboard → **App Review** → **Permissions and Features** → mỗi permission có ô **Instructions for Reviewer**, paste:

```
1. Login URL: https://dhtcdanang.com/admin/login
2. Admin credentials: 
   Email: reviewer@dhtcdanang.com
   Password: (see Test User Credentials section above)
3. Test FB Page: "DHTC Test — Review Only" (Page ID: <test-page-id>)
4. Test User account: <test-user-email>@tfbnw.net
5. Screencast: <youtube-unlisted-or-drive-url>
6. Reproduction steps for this permission: 
   - See screencast Scene <N> at timestamp <mm:ss>
   - Or follow these steps: <step-by-step>
```

---

## 8. Checklist trước khi submit

- [ ] Test User created và credentials đã lưu
- [ ] Test Page created, Test User là admin
- [ ] 4 seed posts/comments đã đăng trên Test Page
- [ ] Admin account `reviewer@dhtcdanang.com` đã tạo + expires_at set
- [ ] Test Page đã subscribe webhook
- [ ] App đã được Test User cài (App Settings → Advanced → Allow API access)
- [ ] Screencast quay xong, URL hoạt động (unlisted YouTube hoặc Drive shared)
- [ ] Privacy Policy + Terms URLs live + show DHTC branding
- [ ] Data deletion callback returns 200 trên POST request
- [ ] Submission text từ `submission.md` đã copy vào dashboard

---

## 9. Sau khi pass review

```bash
# Xoá admin account của reviewer
docker exec -it dhtc-api python -m app.scripts.delete_admin \
  --email reviewer@dhtcdanang.com

# Xoá test Page (qua FB UI)
# Xoá test user (Meta Dashboard → Roles → Test Users → Delete)
```

---

## 10. Nếu reviewer reject

Đọc kỹ lý do reject trong dashboard. Các lý do phổ biến và cách fix:

| Reject reason | Fix |
|---|---|
| "Cannot reproduce" | Quay lại screencast với high-zoom, slower pace, more callouts |
| "Use case not clear" | Mở rộng phần "Why we need it" trong submission.md, thêm screenshot |
| "Privacy policy missing X" | Update https://dhtcdanang.com/privacy add đoạn về retention/sharing |
| "Compliance concern with 24h policy" | Quay video close-up cho timestamp check + disabled state |
| "Test user has insufficient permissions" | Re-create Test User với "All permissions" flag |

Resubmit sau khi fix; mỗi vòng review thường 5-7 ngày.
