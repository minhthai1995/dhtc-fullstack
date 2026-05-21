# Requirements — Feature: P5C-enrich · CRM Profile Enrichment

**Version:** 0.1 (draft)
**Status:** 🔴 Draft — chờ duyệt
**Last updated:** 2026-05-21

---

## Mô tả

Trang `/admin/crm` hiện chỉ hiển thị `fb_user_id` thô (PSID kiểu `1234567890`) — admin không nhận diện được khách hàng là ai. Spec này cache tên + avatar + age_range + gender từ Graph API `/{psid}` lần đầu thấy PSID, sau đó enrich endpoint `/admin/crm/conversations` trả về profile thật. Đồng thời derive 3 signal nội bộ (quốc gia, ngôn ngữ, sinh nhật khai trong chat) để bù cho field FB chặn từ 2018.

**KHÔNG scrape facebook.com** — pivot dựa trên research 2026-05-21 (vi phạm Nghị định 13/2023 VN + login wall + WAF 5/5).

---

## Người dùng mục tiêu

- **User chính:** admin DHTC vận hành CRM, cần nhận diện khách hàng quay lại
- **User gián tiếp:** không có (internal)
- **Quy mô MVP:** ~100-500 PSID active/tháng, mỗi PSID call Graph 1 lần rồi cache TTL 30 ngày

---

## Yêu cầu nghiệp vụ

### Phải có (Must have)

- [ ] Lần đầu webhook nhận PSID mới → background call `GET https://graph.facebook.com/v22.0/{psid}?fields=id,name,picture,age_range,gender&access_token={page_token}` → cache vào `MessengerProfile` (model mới hoặc extend `FBProfile`)
- [ ] Cache TTL 30 ngày — sau hạn refresh lại nếu PSID còn active
- [ ] Endpoint `GET /api/v1/admin/crm/conversations` enrich payload mỗi conversation thêm: `fb_name`, `fb_avatar_url`, `age_range`, `gender`, `derived_country`, `derived_lang`, `declared_birthday`
- [ ] Endpoint `GET /api/v1/admin/crm/conversations/{session_id}/profile` trả full profile + intent history (đã có trong plan CRM trước đó)
- [ ] Frontend Tab "Khách hàng" hiển thị: cột Avatar + Tên FB + Age range + Gender + Country flag (VN/Other/—) + Last seen
- [ ] Empty state honest: field nào không có data → hiển thị `—` italic muted (không fake/đoán)
- [ ] Logged: mỗi call Graph API thành công/thất bại → table `fb_graph_call_log` (debug + rate-limit awareness)

### Nên có (Should have)

- [ ] Tooltip trên avatar: hiển thị PSID + cache age (debug aid cho admin)
- [ ] Bulk-refresh button: admin click → trigger background re-fetch toàn bộ PSID > 30 ngày
- [ ] Privacy badge: nếu user đã thực hiện FB Login (P5A) → badge "Verified user" thay vì chỉ PSID

### Không làm (Out of scope)

- ❌ Scrape facebook.com (research đã loại)
- ❌ Apply Meta App Review xin `user_birthday/user_hometown/user_location` (4-8 tuần, defer sang sprint sau)
- ❌ Cross-page deduplication (cần ids_for_pages — yêu cầu cùng Business Manager)
- ❌ ML/AI intent classification (giữ keyword classifier hiện tại)

---

## Tiêu chí thành công

- Admin vào `/admin/crm` → tab Khách hàng thấy tên thật + avatar cho **≥80%** PSID active 7 ngày gần nhất (số còn lại có thể là PSID mới chưa cache)
- Lần load đầu của endpoint conversations: ≤500ms với 50 conversations
- Graph API call: rate limit ≤200 req/hour/page (Meta limit ~4800/hour, dư an toàn)
- Test suite: ≥85% coverage trên service mới, mock Graph API response

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Page token expire | Cache last refresh time, alert admin khi >55 ngày (page token sống 60 ngày) |
| User opt-out (Meta Data Policy) → trả 400 | Catch + lưu `MessengerProfile.status='opted_out'`, hiển thị "Privacy-protected" trong CRM |
| Cache race condition (2 webhook cùng PSID mới) | UNIQUE constraint trên `psid` + `ON CONFLICT DO NOTHING` |
| Graph API trả profile_pic URL hết hạn (TTL ngắn) | Re-fetch khi >7 ngày, hoặc proxy qua `/api/v1/admin/avatar/{psid}` |

---

## Dependencies

- ✅ P5A FB OAuth done → có `FACEBOOK_APP_ID/SECRET` trong env
- ✅ P5B Webhook done → có Page access token (lấy từ webhook subscription)
- ⏳ P4A T7-T13 (customer_cluster) — KHÔNG block, có thể làm song song
- ⏳ `PAGE_ACCESS_TOKEN` env var (cần thêm vào `.env.example`)
