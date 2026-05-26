# Business Verification — Checklist giấy tờ

Meta yêu cầu **Business Verification** trước khi cấp Advanced permissions (4/5 permissions trong submission đều là Advanced). Đây là bước đầu tiên, làm 1 lần, dùng được cho mọi App của business sau này.

**Thời gian**: 1-2 tuần (Meta review nội bộ)
**Chi phí**: $0
**Đường vào**: https://business.facebook.com/settings/security

---

## Giấy tờ cần chuẩn bị

### 1. Giấy phép kinh doanh (Business Documentation)

**Yêu cầu của Meta**: scan PDF/JPG của giấy tờ chứng minh business tồn tại hợp pháp.

**Việt Nam chấp nhận** (Meta đã verify nhiều business VN):
- [ ] **Giấy chứng nhận đăng ký doanh nghiệp** (GPKD) — bản chính scan màu, đọc rõ MST
- [ ] Hoặc **Quyết định thành lập** (nếu là tổ chức không có GPKD)
- [ ] Hoặc **Đăng ký hộ kinh doanh cá thể** + CCCD chủ hộ (nếu hộ gia đình)

**Lưu ý**:
- Tên trên giấy tờ phải KHỚP với "Legal business name" trong Business Manager
- Địa chỉ phải KHỚP với địa chỉ đăng ký Business Manager
- Nếu GPKD song ngữ → ưu tiên submit; nếu chỉ tiếng Việt → kèm bản dịch công chứng EN (Meta accept)

---

### 2. Bằng chứng địa chỉ (Address Verification)

Meta yêu cầu xác nhận business **đang hoạt động tại địa chỉ đó**.

**Chấp nhận** (chọn 1, < 6 tháng tuổi):
- [ ] **Hoá đơn điện** (EVN) ghi tên + địa chỉ business
- [ ] **Hoá đơn nước** (Dawaco/SAWACO) ghi tên + địa chỉ
- [ ] **Hoá đơn internet** (Viettel/VNPT/FPT) — phải là invoice business, không phải hộ gia đình
- [ ] **Sao kê ngân hàng business account** (BIDV/Vietcombank/...) có địa chỉ in trên header
- [ ] **Hợp đồng thuê mặt bằng** + biên lai thanh toán gần nhất

**Lưu ý**:
- Nếu địa chỉ trên hoá đơn ≠ địa chỉ GPKD → phải có giải trình + thêm 1 giấy tờ thứ 2
- Hoá đơn điện tử EVN download từ EVNHCMC/EVNCPC.vn → in PDF có MSXT (mã số xác thực) → Meta accept

---

### 3. Bằng chứng số điện thoại (Phone Verification)

Meta sẽ gọi/SMS verify.

**Chuẩn bị**:
- [ ] Số HOTLINE business (không phải số cá nhân)
- [ ] Đầu số khớp khu vực: Đà Nẵng `+84 236...` cho cố định, hoặc mobile `+84 9xx`
- [ ] Phải nhận được cuộc gọi/SMS từ Meta (US/Ireland number, tiếng Anh)
- [ ] Code SMS có hiệu lực 10 phút → có người trực sẵn

---

### 4. Email business (Email Verification)

- [ ] Email `@dhtcdanang.com` (KHÔNG dùng gmail/yahoo cho business email)
- [ ] DNS MX records configured (xác nhận domain ownership)
- [ ] Inbox active để nhận verification link từ Meta

---

### 5. Website (Domain Verification)

- [ ] https://dhtcdanang.com live + có nội dung business (đã ✅ — landing đã deploy)
- [ ] Privacy Policy public: https://dhtcdanang.com/privacy (đã ✅)
- [ ] Terms of Service public: https://dhtcdanang.com/terms (đã ✅)
- [ ] Domain TXT record hoặc HTML meta tag verify ownership trong Business Manager → **Brand Safety** → **Domains** → **Add Domain**

**TXT record example** (Meta cung cấp):
```
TXT @ facebook-domain-verification=<random-string>
```

---

### 6. Thông tin Business Manager khớp giấy tờ

Vào https://business.facebook.com/settings/info → kiểm tra:

- [ ] **Legal business name**: khớp với tên trên GPKD (KHÔNG dùng tên thương hiệu nếu khác)
- [ ] **Country**: Vietnam
- [ ] **Address**: khớp địa chỉ GPKD, viết theo format UK (đường, quận, thành phố, mã bưu chính)
- [ ] **Phone**: số hotline đã verify
- [ ] **Website**: dhtcdanang.com
- [ ] **Tax ID / Business registration number**: MST 13 số trên GPKD

→ Bất kỳ trường nào sai/thiếu → Meta auto-reject vòng đầu.

---

## Quy trình submit

1. Login https://business.facebook.com → chọn business → **Security Center** → **Verify your business**
2. Click **Start verification**
3. Form steps:
   - **Business details** → confirm thông tin trên đã đúng
   - **Verify domain** → choose method (DNS TXT recommended)
   - **Upload documents** → upload GPKD + bằng chứng địa chỉ (PDF/JPG, < 10MB mỗi file)
   - **Contact info** → choose phone + email verification method
   - **Submit** → status chuyển sang **In Review**
4. Đợi 1-2 tuần. Meta gửi email khi xong (PASS hoặc REJECT với lý do)

---

## Common rejects + fix

| Reject reason | Fix |
|---|---|
| "Documents don't match business info" | Re-upload GPKD scan màu rõ nét hơn, đảm bảo tên + địa chỉ + MST khớp Business Manager 100% |
| "Address proof too old" | Upload hoá đơn điện/nước < 90 ngày |
| "Domain not verified" | Check DNS TXT propagated (dig TXT dhtcdanang.com); đợi 24h sau khi add record |
| "Phone verification failed" | Đảm bảo có người Anh ngữ trực để confirm code khi Meta gọi |
| "Business name mismatch" | Edit Business Manager → Legal name khớp GPKD CHÍNH XÁC (kể cả "Công ty TNHH" vs "TNHH") |

---

## Timeline kỳ vọng

| Step | Estimated time |
|------|----------------|
| Chuẩn bị giấy tờ (scan + check khớp BM info) | 1-2 ngày |
| Submit + Meta acknowledge | < 1 ngày |
| Meta review | 5-14 ngày |
| Nếu pass → có thể submit App Review ngay | — |
| Nếu reject → fix + resubmit | +5-7 ngày mỗi vòng |

**Tổng**: 1-3 tuần cho Business Verification, **trước khi** có thể submit App Review cho 5 permissions.

---

## Sau khi PASS Business Verification

- Business Manager có badge ✓ **Verified**
- Tất cả Apps trong Business Manager đủ điều kiện submit Advanced permissions
- Có thể tiến hành submit **App Review** (xem `submission.md` + `screencast-script.md`)
- KHÔNG cần verify lại trừ khi đổi pháp nhân
