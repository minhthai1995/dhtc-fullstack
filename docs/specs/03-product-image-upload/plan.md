# Plan — Feature: Product Image Upload (P3)

**Version:** 0.1 (DRAFT — chờ review)
**Status:** 📝 Drafting
**Last updated:** 2026-05-20

---

## Phases

### Phase 1 — Backend pipeline (~4h)

**Mục tiêu:** Endpoint upload chạy được, Pillow pipeline ra 4 WebP, tests pass.

- Cài Pillow + pillow-heif vào `backend/requirements.txt`
- Config `UPLOAD_DIR` trong `.env.example` + `core/config.py`
- Schemas Pydantic `product_image.py` (In/Out/Urls)
- Service `image_service.py` (validate + Pillow transcode + 4 sizes WebP)
- Endpoint `POST /api/v1/products/images` (multipart) + DELETE
- Auth dep `require_seller_or_admin`
- Mount StaticFiles `/uploads` trong `main.py`
- `.gitignore` thêm `backend/uploads/`
- pytest: 7 tests (happy, 401, oversized, invalid MIME, malformed, delete, EXIF rotation)

**Done when:** `curl -F file=@test.jpg -H "Bearer ..." /api/v1/products/images` → 201 với 4 URL, file tồn tại trên disk.

---

### Phase 2 — Frontend ImageUploader (~4h)

**Mục tiêu:** Component dùng được trong `SellerProductEdit`, drag-drop + preview + upload + delete + reorder.

- Cài `browser-image-compression` vào `frontend/package.json`
- Types `ProductImage` trong `features/products/types.ts`
- API client `productImages.api.ts` (upload, delete)
- Component `ImageUploader.tsx`:
  - Dropzone + click-to-pick (native HTML5)
  - Preview qua URL.createObjectURL
  - Multi-file upload với progress
  - Tile grid: badge "Ảnh chính" + nút X + drag-handle
  - Reorder qua native HTML5 drag-drop
  - Toast errors tiếng Việt
- Tích hợp vào `SellerProductEdit.tsx`: thay `<input type="url">` bằng `<ImageUploader>`
- Backward compat: render legacy `{url:""}` entries cũng được
- vitest: 5 tests cơ bản

**Done when:** Seller mở `/seller/products/new`, drag 3 ảnh từ Finder → save → mở lại edit thấy 3 ảnh đúng thứ tự.

---

### Phase 3 — Polish + E2E (~2h)

**Mục tiêu:** Client compression hoạt động cho ảnh phone lớn, e2e green, handoff updated.

- Test client-side compression với ảnh JPEG 5MB → compress xuống ~1MB trước upload
- Optimize: dùng `medium` URL trên product card customer-facing (`ProductCard.tsx`, `ShopPage.tsx`), `large` trên product detail, `thumb` trên cart/order list
- Update legacy entries trong DB chưa cần (FE handle backward compat)
- Playwright e2e: upload flow đầy đủ qua fixture image
- Update `handoff.md` TL;DR + session log
- Tick tasks.md

**Done when:** Playwright e2e pass, customer-facing pages dùng medium thumbnail load nhanh, tasks.md ✅ 100%.

---

## Risks

| Risk | Mitigation |
|------|------------|
| HEIC từ iPhone không decode được | `pillow-heif` register_heif_opener() khi app start; nếu fail → fallback message "iPhone? Vui lòng đổi cài đặt Camera → Most Compatible" |
| Disk fill up vì user spam upload | Phase 4 P5: cron cleanup orphan images + per-seller quota (50 ảnh tối đa). MVP: monitoring `df` manual |
| FastAPI StaticFiles chậm khi nhiều request | Note tech debt: production phải serve qua nginx/Caddy → cấu hình Caddyfile sau khi deploy |
| Pillow CVE (image bombs) | Pillow ≥ 10.0 có `MAX_IMAGE_PIXELS` default ~178M pixels → safe. Add `Image.MAX_IMAGE_PIXELS = 50_000_000` bảo thủ hơn |
| browser-image-compression không support iOS Safari < 14 | Lib có fallback graceful (raw upload nếu compress fail). Server validate vẫn enforce 2MB → safe |
| Test fixture image (JPEG bytes) trong pytest | Dùng Pillow generate runtime: `Image.new("RGB", (100, 100)).save(buf, "JPEG")` → ~1KB test fixture không cần commit |

---

## Dependencies

**Backend Python:**
```
Pillow>=10.1.0
pillow-heif>=0.13.0
```

**Frontend npm:**
```
browser-image-compression@^2.0.2
```

**Existing reuse:**
- `python-multipart` (đã có với FastAPI dependency `fastapi[all]`)
- `UploadFile`, `File` from `fastapi` (built-in)
- `axios` + `onUploadProgress` (đã dùng cho API calls)
- TanStack Query `useMutation` (đã có)

---

## Out of scope (defer P4+)

- S3/R2 storage migration
- CDN integration (Cloudflare/BunnyCDN)
- Orphan image cleanup cron
- Per-seller image quota
- Image variants by viewport (srcset)
- Video upload
- Watermark
- AI background removal
- Bulk ZIP upload
