# Requirements — Feature: Product Image Upload (P3)

**Version:** 0.1 (DRAFT — chờ review)
**Status:** 📝 Drafting
**Last updated:** 2026-05-20

---

## Mô tả

Cho phép seller upload ảnh sản phẩm trực tiếp từ máy/điện thoại thay vì phải tự host ảnh ở nơi khác rồi dán URL. Hiện tại `SellerProductEdit.tsx:172` chỉ có `<input type="url">` — yêu cầu seller phải biết Imgur/CDN/hosting → rào cản kỹ thuật cao với tiểu thương Đà Nẵng.

Phạm vi MVP: local disk storage (`backend/uploads/`) + FastAPI StaticFiles serving. Sau P4 đổi sang S3/R2 mà không cần đổi API contract (URL trả về luôn dạng `/uploads/...` → CDN khi migrate sẽ rewrite).

---

## Người dùng mục tiêu

- **Seller (tiểu thương):** Upload ảnh sản phẩm bằng drag-drop hoặc click chọn file từ máy/phone. Không cần biết URL, không cần resize trước, không cần xoay ảnh — tất cả tự động.
- **Customer:** Xem product card/detail với ảnh thumbnail/medium load nhanh (<500ms), ảnh gốc xem chi tiết.
- **Admin:** Khi duyệt sản phẩm, xem ảnh chất lượng cao để kiểm tra.

---

## Yêu cầu nghiệp vụ

### Phải có (Must have)

- [ ] Seller chọn ảnh từ máy/phone qua **drag-drop** hoặc **click → file picker**
- [ ] Multi-select: chọn nhiều ảnh cùng lúc trong 1 dialog
- [ ] Preview ngay lập tức (<100ms) qua `URL.createObjectURL` — không cần đợi upload xong
- [ ] **Tối đa 9 ảnh / sản phẩm** (theo chuẩn Shopee)
- [ ] **Tối đa 2MB / file** sau client-side compression
- [ ] Accept MIME: `image/jpeg`, `image/png`, `image/webp`, `image/heic` (iPhone)
- [ ] Server-side pipeline qua **Pillow**:
  - Auto-orient (`ImageOps.exif_transpose`) → fix ảnh phone xoay 90°/180°
  - Resize 4 sizes: `original` (≤1600x1600) / `large` (800x800) / `medium` (400x400) / `thumb` (200x200)
  - Convert → **WebP quality 85/85/80/75** (giảm 25-35% size vs JPEG)
- [ ] Lưu metadata vào cột `Product.images` JSON: `[{id, urls: {original, large, medium, thumb}, order}]`
- [ ] Seller có thể **xóa từng ảnh** (nút X hover trên thumbnail)
- [ ] Seller có thể **sắp xếp thứ tự ảnh** (drag reorder) — ảnh đầu = ảnh chính hiển thị trên product card
- [ ] Toast error tiếng Việt thân thiện: "Ảnh quá lớn (4.2MB) — tối đa 2MB" thay vì "413 Payload Too Large"
- [ ] DELETE endpoint xóa file thực + DB ref khi seller remove

### Không làm trong MVP (Out of scope)

- ❌ Cloud storage (S3/R2) — local disk MVP, migrate sau P4
- ❌ CDN integration (Cloudflare, BunnyCDN)
- ❌ Video upload
- ❌ AI background removal / auto-enhance
- ❌ Watermark "DHTC.vn"
- ❌ Crop UI thủ công (Pillow tự center-crop)
- ❌ Reupload từ URL (chỉ file upload qua input)
- ❌ Bulk upload qua ZIP/folder
- ❌ Image lazy-loading optimization (browser native `loading="lazy"` đủ)

---

## Ràng buộc kỹ thuật & bảo mật

- **Endpoint upload**: `POST /api/v1/products/images` — requires seller/admin auth (JWT)
- **Endpoint delete**: `DELETE /api/v1/products/images/{image_id}` — requires owner seller hoặc admin
- **Validation server-side**:
  - Check MIME bằng **magic bytes** (không tin Content-Type header) — dùng `Pillow.Image.open()` raise nếu invalid
  - Max raw size 2MB (FastAPI `File()` không có built-in limit → check `len(content)` trong handler)
  - Reject SVG (XSS risk qua embedded script)
- **Storage path**: `backend/uploads/products/{uuid4}/{size}.webp` — uuid4 prevent enumeration
- **`.gitignore`**: thêm `backend/uploads/` → không commit user content
- **Permissions**: chỉ owner của product (qua `merchant_id`) hoặc admin được DELETE
- **Disk space**: 4 sizes WebP × 9 ảnh × ~500KB avg = ~18MB/product. 1000 products = ~18GB → OK cho MVP, monitor và alert khi `/uploads` > 50GB

---

## Acceptance criteria

1. Seller mở `/seller/products/new`, drag 5 ảnh JPG từ desktop vào dropzone → 5 preview hiển thị <100ms
2. Click "Lưu sản phẩm" → progress bar 0→100% → toast "Đã tạo sản phẩm"
3. Mở product page customer-facing → ảnh thumbnail load <500ms, ảnh chính hiển thị đúng orientation (kể cả chụp từ iPhone bị xoay)
4. Seller mở lại product edit → 5 ảnh hiển thị đúng thứ tự, drag ảnh thứ 3 lên đầu → save → reload → ảnh thứ 3 là main
5. Upload ảnh 3MB → toast "Đang nén..." → client-compress xuống 1.5MB → upload thành công
6. Upload ảnh 10MB → toast "Ảnh quá lớn (10MB) — tối đa 2MB sau khi nén"
7. Upload file `.exe` đổi extension `.jpg` → server reject với 422 "File không phải ảnh hợp lệ"
8. Admin xem product detail page → thấy ảnh `original` size đầy đủ chất lượng
