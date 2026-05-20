from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.deps import require_seller_or_admin
from app.models.user import User
from app.schemas.product_image import ProductImageOut
from app.services.image_service import (
    ALLOWED_MIME,
    ImageValidationError,
    process_upload,
)

router = APIRouter(prefix="/products", tags=["products"])


@router.post(
    "/images",
    response_model=ProductImageOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_product_image(
    file: UploadFile = File(...),
    _user: User = Depends(require_seller_or_admin),
) -> ProductImageOut:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Định dạng ảnh không được hỗ trợ (chỉ JPG/PNG/WebP/HEIC)",
        )

    content = await file.read()
    try:
        return process_upload(content, settings.UPLOAD_DIR / "products")
    except ImageValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        ) from e
