# Meta App Review — Documentation Bundle

Tài liệu chuẩn bị cho việc submit Facebook App Review để xin 5 permissions phục vụ flow "trả lời comment check-in + DM voucher trong 24h window".

## File trong thư mục này

| File | Mục đích | Khi nào dùng |
|------|---------|--------------|
| [submission.md](./submission.md) | Use case + justification cho 5 permissions | Paste vào Meta App Dashboard khi submit |
| [screencast-script.md](./screencast-script.md) | Script video 5-7 phút demo end-to-end | Theo từng scene để quay OBS |
| [test-user-setup.md](./test-user-setup.md) | Hướng dẫn tạo Test User + Test Page + admin account | Trước khi submit |
| [business-verification-checklist.md](./business-verification-checklist.md) | Giấy tờ + quy trình Business Verification | LÀM TRƯỚC App Review (yêu cầu tiên quyết) |

## Roadmap submission

```
1. Business Verification           [1-3 tuần]  ← bắt buộc đầu tiên
   └─ business-verification-checklist.md
        │
        ▼
2. Tạo Test User + Test Page       [1 ngày]
   └─ test-user-setup.md
        │
        ▼
3. Quay screencast 5-7 phút        [2-3 ngày]
   └─ screencast-script.md
        │
        ▼
4. Submit App Review               [Meta review 5-14 ngày/vòng]
   └─ submission.md (paste vào dashboard)
        │
        ▼
5. PASS → activate Live Mode + 5 permissions production
```

## Prerequisites (technical)

Trước khi submit App Review, các URL sau phải LIVE và return đúng:

- [ ] https://dhtcdanang.com — landing (đã ✅)
- [ ] https://dhtcdanang.com/privacy — privacy policy (đã ✅)
- [ ] https://dhtcdanang.com/terms — terms of service (đã ✅)
- [ ] https://dhtcdanang.com/admin/login — admin login page
- [ ] https://api.dhtcdanang.com/api/v1/meta/webhook — webhook callback (GET verify + POST event)
- [ ] https://api.dhtcdanang.com/api/v1/meta/data-deletion — data deletion callback (POST returns 200 + confirmation code)
- [ ] https://dhtcdanang.com/auth/fb/callback — OAuth redirect URI

Implementation status: xem `docs/specs/07-proactive-reply/` cho backend spec — phải deploy xong **trước khi** submit để screencast quay được flow thật.

## Permissions xin (tóm tắt)

1. `pages_show_list` — list Pages của admin trong onboarding
2. `pages_read_engagement` — dashboard metrics
3. `pages_read_user_content` — đọc check-in posts/comments
4. `pages_manage_engagement` — reply comment với template
5. `pages_messaging` — DM trong 24h window sau khi user mở conversation

Xem [submission.md](./submission.md) cho justification chi tiết từng permission.

## Compliance tóm tắt

- **24h Messaging Policy**: chỉ DM khi `last_user_message_timestamp < 24h`, check timestamp trước mỗi send
- **No cold DM**: chỉ phản hồi sau khi user gửi tin nhắn trước (qua m.me lure trên comment reply)
- **Single-tenant**: app chỉ phục vụ 1 Page (Page của chính DHTC), KHÔNG multi-tenant SaaS
- **Admin-approved templates**: KHÔNG AI-generated content, mọi reply đều từ template do admin tạo + duyệt
- **Kill switch**: env `PROACTIVE_REPLY_ENABLED=false` tắt feature ngay
- **Rate limit**: 50 reply/Page/ngày
- **Data retention**: 90 ngày cho raw content, sau đó xoá giữ aggregated metrics
- **Token storage**: AES-256 encrypted at rest
