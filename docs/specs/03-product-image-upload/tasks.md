# Tasks — Feature: Product Image Upload (P3)

**Tổng thời gian ước tính:** ~10 giờ (1.5 ngày)
**Status:** 📝 Drafting — chờ duyệt spec

> **Cách dùng file này:**
> - Tick task khi xong: `- [x] T1 ✅`
> - Mỗi task = 1 commit
> - Task ≤ 30 phút — nếu lớn hơn thì chia nhỏ

---

## Backend — Setup & dependencies

- [x] **T1** ✅ — `uv add Pillow>=10.1.0 pillow-heif>=0.13.0` (pillow 12.2.0 + pillow-heif 1.3.0 installed)
- [x] **T2** ✅ — Config `UPLOAD_DIR` (Path) + `MAX_UPLOAD_BYTES` (2MB) trong `config.py` + `.env.example`
- [x] **T3** ✅ — `.gitignore` thêm `backend/uploads/`

## Backend — Schemas & service

- [x] **T4** ✅ — `schemas/product_image.py` (ProductImageUrls + ProductImageOut + ProductImageIn)
- [x] **T5** ✅ — `services/image_service.py` skeleton (SIZES + ALLOWED_MIME + ImageValidationError + MAX_IMAGE_PIXELS)
- [x] **T6** ✅ — `services/image_service.py::process_upload()` (validate + EXIF + 4 WebP sizes)
- [x] **T7** ✅ — `services/image_service.py::delete_image()` (idempotent + path traversal block)
- [x] **T8** ✅ — `register_heif_opener()` trong `main.py` (iPhone HEIC decoding)

## Backend — Endpoints

- [x] **T9** ✅ — Auth dep `require_seller_or_admin` trong `app/deps.py`
- [ ] **T10** — `POST /api/v1/products/images` endpoint trong `api/v1/products.py`
- [ ] **T11** — `DELETE /api/v1/products/images/{image_id}` endpoint
- [ ] **T12** — Mount StaticFiles `/uploads` trong `main.py`

## Backend — Tests

- [ ] **T13** — pytest fixtures: `make_test_image(size)` helper trong `tests/conftest.py`
- [ ] **T14** — `tests/test_product_images.py`: happy + 401 + oversized + invalid MIME
- [ ] **T15** — `tests/test_product_images.py`: malformed image + delete + EXIF rotation

## Frontend — Types & API client

- [ ] **T16** — Cài `browser-image-compression` vào `frontend/package.json`
- [ ] **T17** — Types `ProductImage` + `ProductImageUrls` trong `features/products/types.ts`
- [ ] **T18** — `features/products/productImages.api.ts` (uploadImage + deleteImage)

## Frontend — ImageUploader component

- [ ] **T19** — `ImageUploader.tsx` skeleton + dropzone + click-to-pick (native HTML5)
- [ ] **T20** — Preview grid + URL.createObjectURL + remove button
- [ ] **T21** — Multi-upload với progress (axios onUploadProgress) + parallel mutations
- [ ] **T22** — Client compression (browser-image-compression) cho file > 1.5MB
- [ ] **T23** — Reorder qua native HTML5 drag-drop (draggable + onDragOver + onDrop)
- [ ] **T24** — Toast errors tiếng Việt + validation client-side (MIME + size)

## Frontend — Integrate

- [ ] **T25** — Thay `<input type="url">` bằng `<ImageUploader>` trong `SellerProductEdit.tsx`
- [ ] **T26** — Backward compat: render legacy `{url:""}` entries (fallback `urls.medium ?? url`)
- [ ] **T27** — Update `ProductCard.tsx` + `ShopPage.tsx` dùng `urls.medium` cho thumbnail

## Frontend — Tests

- [ ] **T28** — `tests/products/ImageUploader.test.tsx` (render + max-9 + invalid MIME)
- [ ] **T29** — `tests/products/ImageUploader.test.tsx` (compress + upload happy + reorder state)

## E2E & DevOps

- [ ] **T30** — Playwright e2e `seller.spec.ts`: upload fixture image flow
- [ ] **T31** — Update `handoff.md` TL;DR + session log entry
- [ ] **T32** — Tick toàn bộ tasks.md với commit SHA

---

## Tổng kết

| | Dự kiến | Thực tế |
|--|---------|---------|
| Tasks | 32 | — |
| Tests | 7 BE pytest + 5 FE vitest + 1 e2e = 13 | — |
| Files mới | ~8 (3 BE service/schema/test, 4 FE component/api/types/test, 1 spec) | — |
| Files edit | ~7 (requirements.txt, config.py, main.py, deps.py, products.py, package.json, SellerProductEdit.tsx) | — |
| Thời gian | ~10h | — |
