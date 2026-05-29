# DNS Inventory — dhtcdanang.com (snapshot TRƯỚC khi migrate)

> **Mục đích:** Bản ghi lại toàn bộ DNS hiện tại làm lưới an toàn + tham chiếu rollback.
> Đây là dữ liệu công khai (resolve được qua `dig`), KHÔNG phải secret.
> Mật khẩu domain KHÔNG lưu ở đây.

- **Nguồn:** Panel ZoneDNS (`https://zonedns.vn/domain_info.html`) — chụp màn hình trực tiếp
- **Ngày chụp:** 2026-05-29
- **Nhà cung cấp DNS:** ZoneDNS (dịch vụ DNS của Nhân Hòa), nameservers `ns1-4.zonedns.vn`
- **Registrar:** Nhân Hòa

---

## Bản ghi hiện tại (5 records)

| # | Host | Type | Value | Priority | TTL | Ghi chú |
|---|------|------|-------|----------|-----|---------|
| 1 | `@` | A | `103.28.36.220` | — | **300** | Web apex → cPanel cũ. **ĐÂY là dòng duy nhất sẽ đổi khi cutover.** |
| 2 | `umail._domainkey` | CNAME | `dkim.umailsmtp.com.` | — | 3600 | 📧 **DKIM — KHÔNG ĐỘNG VÀO** |
| 3 | `@` | MX | `smtp.umailsmtp.com.` | 10 | 3600 | 📧 **Mail server — KHÔNG ĐỘNG VÀO** |
| 4 | `@` | TXT | `v=spf1 include:dnsexit.com include:_spf.umailsmtp.com -all` | — | 3600 | 📧 **SPF — KHÔNG ĐỘNG VÀO** |
| 5 | `_dmarc` | TXT | `v=DMARC1; p=quarantine; pct=100; rua=mailto:master@umailsmtp.com` | — | 3600 | 📧 **DMARC — KHÔNG ĐỘNG VÀO** |

**Không có bản ghi `www`** trong zone hiện tại.

---

## Giá trị mục tiêu (Vercel)

| Hành động | Host | Type | Value |
|-----------|------|------|-------|
| **Sửa** record #1 | `@` | A | `76.76.21.21` |
| **Thêm** mới | `www` | CNAME | `cname.vercel-dns.com` |
| **Thêm** mới (giữ web cũ) | `old` | A | `103.28.36.220` |

---

## Rollback (nếu sự cố)

Đổi record #1 (`@` A) **trở lại** `103.28.36.220`. TTL = 300s → web khôi phục trong ~5 phút.
Email không bị ảnh hưởng dù web có sự cố, vì MX/SPF/DKIM/DMARC độc lập với record A.

---

## Email — ranh giới an toàn

4 bản ghi phục vụ email `@dhtcdanang.com` (mail host ngoài: `umailsmtp.com`):
- MX `smtp.umailsmtp.com` (prio 10)
- SPF (TXT `@`)
- DKIM (CNAME `umail._domainkey`)
- DMARC (TXT `_dmarc`)

→ Khi sửa DNS để trỏ web sang Vercel, **chỉ chạm record A**. Tuyệt đối không sửa/xoá 4 dòng trên → email an toàn 100%.
