# Design — Feature: Product Image Upload (P3)

**Version:** 0.1 (DRAFT — chờ review)
**Status:** 📝 Drafting
**Last updated:** 2026-05-20

---

## API Endpoints

| Method | Path | Auth | Request | Response |
|--------|------|------|---------|----------|
| POST | `/api/v1/products/images` | ✅ seller/admin | multipart `file: UploadFile` | `ProductImageOut` 201 |
| DELETE | `/api/v1/products/images/{image_id}` | ✅ owner/admin | — | `204 No Content` |
| GET | `/uploads/products/{uuid}/{size}.webp` | public | — | `image/webp` (StaticFiles) |

**Lưu ý:** Endpoint upload **không** gắn `image_id` vào product ngay — trả về `{id, urls}` cho FE; FE thu thập đủ ảnh thì PATCH/POST product với `images: [...]`. Lý do: cho phép upload ảnh trước khi product được tạo (`/seller/products/new`).

**Cleanup orphan images:** Cron weekly xóa file uploads không có ref trong bất kỳ `Product.images`. Out of scope MVP — chỉ note trong tech debt.

---

## Schema DB — mở rộng `Product.images`

**Không thêm bảng mới.** Cột JSON `Product.images` đã tồn tại (`backend/app/models/product.py:46`), chỉ chuẩn hoá structure:

**Trước:**
```json
[{"url": "https://imgur.com/abc.jpg"}]
```

**Sau:**
```json
[
  {
    "id": "a1b2c3d4-...",
    "urls": {
      "original": "/uploads/products/a1b2c3d4/original.webp",
      "large":    "/uploads/products/a1b2c3d4/large.webp",
      "medium":   "/uploads/products/a1b2c3d4/medium.webp",
      "thumb":    "/uploads/products/a1b2c3d4/thumb.webp"
    },
    "order": 0
  }
]
```

**Backward compat:** legacy entries dạng `{"url": "..."}` vẫn được FE accept (fallback hiển thị `url` nếu không có `urls`). Migration data: không cần — schema JSON tự co giãn.

---

## Pydantic schemas

```python
# schemas/product_image.py
class ProductImageUrls(BaseModel):
    original: str
    large: str
    medium: str
    thumb: str

class ProductImageOut(BaseModel):
    id: str                  # uuid4 — dùng làm folder name
    urls: ProductImageUrls
    order: int = 0

class ProductImageIn(BaseModel):
    """Khi FE gửi update product với danh sách ảnh."""
    id: str
    urls: ProductImageUrls
    order: int = 0
```

`Product.images` typing trong `schemas/product.py` đổi từ `list[dict]` → `list[ProductImageOut]`.

---

## Pillow pipeline — `services/image_service.py`

```python
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image, ImageOps, UnidentifiedImageError

SIZES = {
    "original": (1600, 1600, 85),
    "large":    (800, 800, 85),
    "medium":   (400, 400, 80),
    "thumb":    (200, 200, 75),
}
MAX_UPLOAD_BYTES = 2 * 1024 * 1024  # 2MB
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/heic"}

class ImageValidationError(ValueError):
    """422 khi MIME/size/format không hợp lệ."""

def process_upload(content: bytes, upload_dir: Path) -> ProductImageOut:
    if len(content) > MAX_UPLOAD_BYTES:
        raise ImageValidationError(f"Ảnh quá lớn ({len(content) // 1024}KB) — tối đa 2MB")

    try:
        img = Image.open(BytesIO(content))
        img.verify()  # verify magic bytes
        img = Image.open(BytesIO(content))  # reopen sau verify
    except (UnidentifiedImageError, OSError) as e:
        raise ImageValidationError("File không phải ảnh hợp lệ") from e

    img = ImageOps.exif_transpose(img)  # fix EXIF orientation
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")  # WebP không hỗ trợ palette mode tốt

    image_id = str(uuid4())
    folder = upload_dir / image_id
    folder.mkdir(parents=True, exist_ok=True)

    urls = {}
    for size_name, (w, h, quality) in SIZES.items():
        resized = ImageOps.contain(img, (w, h))  # keep aspect ratio, fit within box
        path = folder / f"{size_name}.webp"
        resized.save(path, format="WEBP", quality=quality, method=6)  # method=6 = best compression
        urls[size_name] = f"/uploads/products/{image_id}/{size_name}.webp"

    return ProductImageOut(id=image_id, urls=ProductImageUrls(**urls), order=0)

def delete_image(image_id: str, upload_dir: Path) -> None:
    folder = upload_dir / image_id
    if folder.exists() and folder.is_dir():
        for f in folder.iterdir():
            f.unlink()
        folder.rmdir()
```

**Lưu ý kỹ thuật:**
- `ImageOps.contain` (Pillow ≥ 9.1) — fit-within giữ aspect ratio, không crop. Phù hợp với e-commerce: không cắt mất sản phẩm.
- `method=6` cho WebP — nén tốt nhất, chậm hơn ~3× method mặc định nhưng acceptable vì ảnh upload không phải hot path.
- HEIC support cần `pillow-heif` extra package (`pip install pillow-heif`) → import trong `main.py`: `from pillow_heif import register_heif_opener; register_heif_opener()`.

---

## FastAPI endpoint — `api/v1/products.py`

```python
@router.post("/images", response_model=ProductImageOut, status_code=201)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_seller_or_admin),
):
    content = await file.read()
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(422, "Định dạng ảnh không được hỗ trợ (chỉ JPG/PNG/WebP/HEIC)")
    try:
        return process_upload(content, settings.UPLOAD_DIR / "products")
    except ImageValidationError as e:
        raise HTTPException(422, str(e))

@router.delete("/images/{image_id}", status_code=204)
async def delete_product_image(
    image_id: str,
    current_user: User = Depends(require_seller_or_admin),
):
    # Note: không check ownership ở MVP vì image chưa link product trong storage
    # Spec sau: track image ownership qua bảng riêng hoặc query Product.images JSON
    delete_image(image_id, settings.UPLOAD_DIR / "products")
```

**Auth dependency mới:** `require_seller_or_admin` trong `api/deps.py` — kiểm tra `current_user.role in ("seller", "admin")`.

---

## StaticFiles mount — `main.py`

```python
from fastapi.staticfiles import StaticFiles

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
```

**Production note:** Dev mode dùng FastAPI StaticFiles OK. Production phải serve qua nginx/Caddy trực tiếp (FastAPI single-thread serve static = bottleneck) — note vào tech debt.

---

## Config `.env`

```bash
# backend/.env.example
UPLOAD_DIR=./uploads          # relative path, FastAPI resolve từ working dir
MAX_UPLOAD_BYTES=2097152      # 2MB
```

`backend/app/core/config.py`:
```python
class Settings(BaseSettings):
    UPLOAD_DIR: Path = Path("./uploads")
    MAX_UPLOAD_BYTES: int = 2 * 1024 * 1024
```

---

## Frontend component — `<ImageUploader>`

**File:** `frontend/src/features/products/ImageUploader.tsx`

**Props:**
```typescript
interface Props {
  value: ProductImage[];          // existing images
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;             // default 9
}

interface ProductImage {
  id: string;
  urls: { original: string; large: string; medium: string; thumb: string };
  order: number;
}
```

**UI layout:**

```
┌─────────────────────────────────────────────┐
│  📷 Kéo thả ảnh vào đây hoặc click để chọn  │
│     (Tối đa 9 ảnh, mỗi ảnh ≤ 2MB)           │
└─────────────────────────────────────────────┘

┌──────┬──────┬──────┐
│ [🏷️] │      │      │   ← Ảnh chính (badge)
│  ✕   │  ✕   │  ✕   │   ← Delete button (hover)
│ thumb│ thumb│ thumb│
└──────┴──────┴──────┘
   ↑ drag để reorder
```

**Behavior:**
1. **Drag-drop**: react-dropzone hoặc native HTML5 `onDragOver`/`onDrop` — chọn native để giảm deps
2. **Click**: hidden `<input type="file" accept="image/*" multiple>` trigger qua label
3. **Preview ngay**: dùng `URL.createObjectURL(file)` cho preview tạm trước khi upload xong
4. **Client compression**: `browser-image-compression` lib — auto compress file > 1.5MB xuống ~1MB trước khi upload (preserve UX cho ảnh phone ~5-10MB)
5. **Upload state**: mỗi tile có overlay `<div>` với progress % (axios `onUploadProgress`)
6. **Reorder**: native HTML5 drag-drop giữa tiles → update `order` field
7. **Delete**: click X → optimistic remove khỏi UI → DELETE API → revert nếu fail

**Dependencies:**
- `browser-image-compression` (~10KB gzipped) — client-side resize trước upload
- Không cần `react-dropzone` — native HTML5 đủ

---

## Upload flow sequence

```
Seller chọn 3 ảnh
  ↓
FE: Preview ngay (URL.createObjectURL × 3)
  ↓
FE: Mỗi ảnh > 1.5MB? → browser-image-compression resize xuống 1MB
  ↓
FE: POST /products/images (multipart) — parallel × 3
  ↓
BE: Validate MIME + size → Pillow pipeline → save 4 WebP × 3
  ↓
BE: Trả về [{id, urls}] × 3
  ↓
FE: Replace preview với urls.medium → set order [0,1,2]
  ↓
FE: Seller drag/delete/reorder tuỳ ý
  ↓
FE: Click "Lưu sản phẩm" → POST/PATCH /products với images array
  ↓
BE: Lưu vào Product.images JSON
```

---

## Validation cascade

| Layer | Check | Reject |
|-------|-------|--------|
| FE pre-upload | MIME via `file.type` | "Chỉ chấp nhận JPG/PNG/WebP" |
| FE pre-upload | Size > 10MB | "Ảnh quá lớn, vui lòng chọn ảnh < 10MB" |
| FE compress | Resize > 2MB → compress | (auto, no toast) |
| BE handler | `content_type` whitelist | 422 "Định dạng không hỗ trợ" |
| BE handler | `len(content) > 2MB` | 422 "Ảnh quá lớn — tối đa 2MB" |
| BE Pillow | `Image.verify()` magic bytes | 422 "File không phải ảnh hợp lệ" |
| BE Pillow | `UnidentifiedImageError` | 422 "Không đọc được file ảnh" |

---

## Test plan

**Backend pytest** (`tests/test_product_images.py`):
1. ✅ `test_upload_jpeg_happy` — upload JPG 500KB → 201 + 4 URLs trả về + file tồn tại trên disk
2. ✅ `test_upload_unauthenticated` — no auth → 401
3. ✅ `test_upload_oversized` — file 3MB → 422 "Ảnh quá lớn"
4. ✅ `test_upload_invalid_mime` — file `.txt` đổi MIME → 422 "Định dạng không hỗ trợ"
5. ✅ `test_upload_malformed_image` — header `image/jpeg` nhưng content là `b"hello"` → 422 "File không phải ảnh hợp lệ"
6. ✅ `test_delete_image` — upload xong → DELETE → 204 + folder không tồn tại
7. ✅ `test_pillow_exif_orientation` — upload ảnh có EXIF orientation 6 (90°) → resized image dimensions phản ánh đã rotate

**Frontend vitest** (`tests/products/ImageUploader.test.tsx`):
1. Render dropzone + accept multiple files
2. Reject khi > 9 ảnh
3. Reject khi MIME không hợp lệ
4. Compress + upload happy path (mock fetch)
5. Reorder qua native drag (jsdom limit — chỉ test state update)

**Playwright e2e** (`e2e/seller.spec.ts`):
1. Seller login → product new → upload 2 ảnh fixture → save → product list có ảnh
