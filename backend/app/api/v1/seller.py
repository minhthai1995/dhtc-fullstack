from __future__ import annotations

from datetime import date, datetime

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.db import get_db
from app.crud import merchant as merchant_crud
from app.crud import order as order_crud
from app.crud import product as product_crud
from app.crud import promotion as promotion_crud
from app.crud import shipping as shipping_crud
from app.crud import wallet as wallet_crud
from app.deps import require_seller
from app.models.merchant import Merchant
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product, ProductStatus
from app.models.promotion import Promotion
from app.models.shipping import ShippingZone
from app.models.user import User
from app.models.wallet import TransactionType
from app.schemas.merchant import MerchantCreate, MerchantRead, MerchantUpdate
from app.schemas.order import OrderDetail, OrderRead, OrderStatusUpdate, UpdateOrderStatus
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.schemas.promotion import PromotionCreate, PromotionRead, PromotionUpdate
from app.schemas.shipping import ShippingZoneCreate, ShippingZoneRead, ShippingZoneUpdate
from app.schemas.wallet import WalletSummary, WalletTransactionRead, WithdrawRequest
from app.services.image_service import (
    ALLOWED_MIME,
    ImageValidationError,
    delete_image,
    process_upload,
)

_MERCHANT_URL_PREFIX = "/uploads/merchants"

router = APIRouter(prefix="/seller", tags=["seller"])


async def _get_merchant_or_404(db: AsyncSession, user_id: int):
    merchant = await merchant_crud.get_by_user_id(db, user_id)
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant profile not found. Please create your shop first.",
        )
    return merchant


async def _get_merchant_locked_or_404(db: AsyncSession, user_id: int):
    result = await db.execute(
        select(Merchant).where(Merchant.user_id == user_id).with_for_update()
    )
    merchant = result.scalar_one_or_none()
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant profile not found. Please create your shop first.",
        )
    return merchant


# ── Dashboard schemas ─────────────────────────────────────────────────────────

class SellerRevenuePoint(BaseModel):
    month: str
    revenue: float  # in millions VND


class SellerPendingOrder(BaseModel):
    id: int
    customer_name: str
    total_amount: float
    created_at: datetime


class SellerDashboard(BaseModel):
    merchant_name: str
    total_revenue: float
    total_orders: int
    pending_count: int
    revenue_chart: list[SellerRevenuePoint]
    pending_orders: list[SellerPendingOrder]


# ── Setup ─────────────────────────────────────────────────────────────────────

@router.post("/setup", response_model=MerchantRead, status_code=status.HTTP_201_CREATED)
async def setup_merchant(
    body: MerchantCreate,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> MerchantRead:
    existing = await merchant_crud.get_by_user_id(db, user.id)
    if existing:
        raise HTTPException(status_code=409, detail="Merchant profile already exists")
    merchant = await merchant_crud.create(db, user.id, body)
    return MerchantRead.model_validate(merchant)


# ── Dashboard ────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=SellerDashboard)
async def seller_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
) -> SellerDashboard:
    merchant_result = await db.execute(
        select(Merchant).where(Merchant.user_id == current_user.id)
    )
    merchant = merchant_result.scalar_one_or_none()

    if not merchant:
        return SellerDashboard(
            merchant_name="",
            total_revenue=0.0,
            total_orders=0,
            pending_count=0,
            revenue_chart=[],
            pending_orders=[],
        )

    # Total revenue (delivered orders only) and total order count
    revenue_result = await db.execute(
        select(
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.count(Order.id).label("cnt"),
        ).where(
            Order.merchant_id == merchant.id,
            Order.status == OrderStatus.delivered,
        )
    )
    rev_row = revenue_result.one()
    total_revenue = float(rev_row.revenue)
    total_orders = rev_row.cnt

    # Pending count
    pending_count_result = await db.execute(
        select(func.count(Order.id)).where(
            Order.merchant_id == merchant.id,
            Order.status == OrderStatus.pending,
        )
    )
    pending_count = pending_count_result.scalar_one()

    # Revenue chart: last 6 months of delivered orders
    def _months_back(start: date, n: int) -> list[tuple[int, int]]:
        result = []
        y, m = start.year, start.month
        for _ in range(n):
            result.append((y, m))
            m -= 1
            if m == 0:
                m = 12
                y -= 1
        return list(reversed(result))

    today = date.today()
    month_slots = _months_back(today, 6)
    # earliest month boundary
    first_y, first_m = month_slots[0]
    chart_q = (
        select(
            func.extract("year", Order.created_at).label("yr"),
            func.extract("month", Order.created_at).label("mo"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
        )
        .where(
            Order.merchant_id == merchant.id,
            Order.status == OrderStatus.delivered,
        )
        .group_by("yr", "mo")
    )
    chart_result = await db.execute(chart_q)
    chart_data: dict[tuple[int, int], float] = {
        (int(row.yr), int(row.mo)): float(row.revenue)
        for row in chart_result.all()
    }
    revenue_chart = [
        SellerRevenuePoint(
            month=f"T{m}",
            revenue=round(chart_data.get((y, m), 0.0) / 1_000_000, 4),
        )
        for y, m in month_slots
    ]

    # Last 5 pending orders containing this merchant's products
    pending_orders_q = (
        select(
            Order.id,
            Order.total_amount,
            Order.created_at,
            User.full_name,
            User.email,
        )
        .join(User, User.id == Order.customer_id)
        .where(
            Order.merchant_id == merchant.id,
            Order.status == OrderStatus.pending,
        )
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    pending_orders_result = await db.execute(pending_orders_q)
    pending_orders = [
        SellerPendingOrder(
            id=row.id,
            customer_name=row.full_name or row.email,
            total_amount=float(row.total_amount),
            created_at=row.created_at,
        )
        for row in pending_orders_result.all()
    ]

    return SellerDashboard(
        merchant_name=merchant.shop_name,
        total_revenue=total_revenue,
        total_orders=total_orders,
        pending_count=pending_count,
        revenue_chart=revenue_chart,
        pending_orders=pending_orders,
    )


# ── Analytics ────────────────────────────────────────────────────────────────

@router.get("/analytics/top-products")
async def get_top_products(
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    merchant = await merchant_crud.get_by_user_id(db, user.id)
    if not merchant:
        return []
    result = await db.execute(
        select(Product)
        .where(Product.merchant_id == merchant.id)
        .order_by(Product.sold_count.desc())
        .limit(5)
    )
    products = result.scalars().all()
    return [
        {
            "id": p.id, "name_vi": p.name_vi, "sold_count": p.sold_count,
            "price": float(p.price), "stock": p.stock, "status": p.status.value,
        }
        for p in products
    ]


@router.get("/analytics/products")
async def get_product_analytics(
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """Per-product revenue breakdown from delivered orders."""
    merchant = await merchant_crud.get_by_user_id(db, user.id)
    if not merchant:
        return []

    # Get all delivered order items for this merchant
    result = await db.execute(
        select(
            OrderItem.product_id,
            Product.name_vi,
            func.sum(OrderItem.quantity).label("total_qty"),
            func.coalesce(
                func.sum(OrderItem.quantity * OrderItem.unit_price), 0
            ).label("total_revenue"),
        )
        .join(Product, OrderItem.product_id == Product.id)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.merchant_id == merchant.id,
            Order.status == OrderStatus.delivered,
        )
        .group_by(OrderItem.product_id, Product.name_vi)
        .order_by(func.sum(OrderItem.quantity * OrderItem.unit_price).desc())
        .limit(10)
    )
    rows = result.all()

    total_rev = sum(float(r.total_revenue) for r in rows) or 1
    return [
        {
            "product_id": r.product_id,
            "name_vi": r.name_vi,
            "total_qty": int(r.total_qty),
            "total_revenue": float(r.total_revenue),
            "revenue_pct": round(float(r.total_revenue) / total_rev * 100, 1),
        }
        for r in rows
    ]


@router.get("/products/low-stock")
async def get_low_stock_products(
    threshold: int = Query(default=10, ge=1, le=100000),
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    merchant = await merchant_crud.get_by_user_id(db, user.id)
    if not merchant:
        return []
    result = await db.execute(
        select(Product)
        .where(
            Product.merchant_id == merchant.id,
            Product.stock <= threshold,
            Product.status == ProductStatus.active,
        )
        .order_by(Product.stock.asc())
    )
    products = result.scalars().all()
    return [
        {"id": p.id, "name_vi": p.name_vi, "stock": p.stock, "price": float(p.price)}
        for p in products
    ]


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get("/profile", response_model=MerchantRead)
async def get_profile(
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> MerchantRead:
    merchant = await _get_merchant_or_404(db, user.id)
    return MerchantRead.model_validate(merchant)


@router.put("/profile", response_model=MerchantRead)
async def update_profile(
    body: MerchantUpdate,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> MerchantRead:
    locked = await db.execute(
        select(Merchant).where(Merchant.user_id == user.id).with_for_update()
    )
    merchant = locked.scalar_one_or_none()
    if not merchant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant profile not found. Please create your shop first.",
        )
    merchant = await merchant_crud.update(db, merchant, body)
    return MerchantRead.model_validate(merchant)


# ── Brand assets (logo + banner) ─────────────────────────────────────────────

def _cleanup_old_merchant_image(old_url: str | None) -> None:
    """Best-effort deletion of the previous image folder when a field is
    replaced or cleared. Silent on failure — orphaned files don't justify
    blocking the user's upload."""
    if not old_url or not old_url.startswith(_MERCHANT_URL_PREFIX + "/"):
        return
    parts = old_url.split("/")
    if len(parts) < 4:
        return
    import contextlib
    with contextlib.suppress(ImageValidationError, OSError):
        delete_image(parts[3], settings.UPLOAD_DIR / "merchants")


async def _set_merchant_image(
    db: AsyncSession,
    merchant: Merchant,
    file: UploadFile,
    field: str,
) -> MerchantRead:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Định dạng ảnh không được hỗ trợ (chỉ JPG/PNG/WebP/HEIC)",
        )
    content = await file.read()
    try:
        result = process_upload(
            content, settings.UPLOAD_DIR / "merchants", _MERCHANT_URL_PREFIX
        )
    except (ImageValidationError, OSError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        ) from e

    _cleanup_old_merchant_image(getattr(merchant, field))
    setattr(merchant, field, result.urls.large)
    await db.commit()
    await db.refresh(merchant)
    return MerchantRead.model_validate(merchant)


async def _clear_merchant_image(
    db: AsyncSession, merchant: Merchant, field: str
) -> MerchantRead:
    _cleanup_old_merchant_image(getattr(merchant, field))
    setattr(merchant, field, None)
    await db.commit()
    await db.refresh(merchant)
    return MerchantRead.model_validate(merchant)


@router.post("/profile/logo", response_model=MerchantRead)
async def upload_merchant_logo(
    file: UploadFile = File(...),
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> MerchantRead:
    merchant = await _get_merchant_locked_or_404(db, user.id)
    return await _set_merchant_image(db, merchant, file, "logo_url")


@router.delete("/profile/logo", response_model=MerchantRead)
async def delete_merchant_logo(
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> MerchantRead:
    merchant = await _get_merchant_locked_or_404(db, user.id)
    return await _clear_merchant_image(db, merchant, "logo_url")


@router.post("/profile/banner", response_model=MerchantRead)
async def upload_merchant_banner(
    file: UploadFile = File(...),
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> MerchantRead:
    merchant = await _get_merchant_locked_or_404(db, user.id)
    return await _set_merchant_image(db, merchant, file, "banner_url")


@router.delete("/profile/banner", response_model=MerchantRead)
async def delete_merchant_banner(
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> MerchantRead:
    merchant = await _get_merchant_locked_or_404(db, user.id)
    return await _clear_merchant_image(db, merchant, "banner_url")


# ── Products ──────────────────────────────────────────────────────────────────

@router.get("/products", response_model=list[ProductRead])
async def list_products(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> list[ProductRead]:
    merchant = await _get_merchant_or_404(db, user.id)
    products = await product_crud.get_by_merchant(db, merchant.id, skip=skip, limit=limit)
    return [ProductRead.model_validate(p) for p in products]


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreate,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> ProductRead:
    merchant = await _get_merchant_or_404(db, user.id)
    product = await product_crud.create(db, merchant.id, body)
    return ProductRead.model_validate(product)


@router.put("/products/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    body: ProductUpdate,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> ProductRead:
    merchant = await _get_merchant_or_404(db, user.id)
    locked = await db.execute(
        select(Product).where(Product.id == product_id).with_for_update()
    )
    product = locked.scalars().first()
    if not product or product.merchant_id != merchant.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product = await product_crud.update(db, product, body)
    return ProductRead.model_validate(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> None:
    merchant = await _get_merchant_or_404(db, user.id)
    product_result = await db.execute(
        select(Product).where(Product.id == product_id).with_for_update()
    )
    product = product_result.scalar_one_or_none()
    if not product or product.merchant_id != merchant.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await product_crud.delete(db, product)


class StockUpdateItem(BaseModel):
    id: int
    stock: int = Field(ge=0)


@router.patch("/products/bulk-stock")
async def bulk_update_stock(
    items: list[StockUpdateItem],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
) -> dict[str, int]:
    if len(items) > 200:
        raise HTTPException(status_code=422, detail="Maximum 200 items per request")
    merchant_result = await db.execute(
        select(Merchant).where(Merchant.user_id == current_user.id)
    )
    merchant = merchant_result.scalars().first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    updated = 0
    for item in items:
        result = await db.execute(
            select(Product).where(Product.id == item.id).with_for_update()
        )
        product = result.scalars().first()
        if product and product.merchant_id == merchant.id:
            product.stock = item.stock
            updated += 1
    await db.commit()
    return {"updated": updated}


# ── Orders ────────────────────────────────────────────────────────────────────

@router.get("/orders", response_model=list[OrderDetail])
async def list_orders(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> list[OrderDetail]:
    merchant = await _get_merchant_or_404(db, user.id)
    orders = await order_crud.get_by_merchant(db, merchant.id, skip=skip, limit=limit)
    return [OrderDetail.model_validate(o) for o in orders]


@router.get("/orders/{order_id}", response_model=OrderDetail)
async def get_order(
    order_id: int,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> OrderDetail:
    merchant = await _get_merchant_or_404(db, user.id)
    order = await order_crud.get_by_id(db, order_id)
    if not order or order.merchant_id != merchant.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return OrderDetail.model_validate(order)


@router.patch("/orders/{order_id}/status", response_model=OrderRead)
async def seller_update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
) -> OrderRead:
    # Resolve merchant
    merchant_result = await db.execute(
        select(Merchant).where(Merchant.user_id == current_user.id)
    )
    merchant = merchant_result.scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a merchant")

    # Fetch order
    order_result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .with_for_update()
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Verify order belongs to this merchant
    if order.merchant_id != merchant.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your order"
        )

    # Restrict allowed transitions: pending→processing, processing→shipped
    allowed_transitions: dict[OrderStatus, OrderStatus] = {
        OrderStatus.pending: OrderStatus.processing,
        OrderStatus.processing: OrderStatus.shipped,
    }
    allowed_next = allowed_transitions.get(order.status)
    if payload.status not in allowed_transitions.values() or allowed_next != payload.status:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot transition from '{order.status}' to '{payload.status}'",
        )

    updated = await order_crud.update_status(
        db,
        order,
        UpdateOrderStatus(status=payload.status, tracking_number=payload.tracking_number),
        note=payload.note,
    )
    return OrderRead.model_validate(updated)


# ── Wallet ────────────────────────────────────────────────────────────────────

@router.get("/wallet", response_model=WalletSummary)
async def get_wallet(
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> WalletSummary:
    merchant = await _get_merchant_or_404(db, user.id)
    balance = await wallet_crud.get_balance(db, merchant.id)
    total_sales = await wallet_crud.get_total_by_type(db, merchant.id, TransactionType.sale)
    total_withdrawals = abs(
        await wallet_crud.get_total_by_type(db, merchant.id, TransactionType.withdrawal)
    )
    pending_result = await db.execute(
        select(func.count(Order.id)).where(
            Order.merchant_id == merchant.id,
            Order.status == OrderStatus.pending,
        )
    )
    pending_orders = pending_result.scalar_one()
    last_bank_name, last_bank_account = await wallet_crud.get_last_withdrawal_bank(
        db, merchant.id
    )
    return WalletSummary(
        balance=balance,
        total_sales=total_sales,
        total_withdrawals=total_withdrawals,
        pending_orders=pending_orders,
        last_bank_name=last_bank_name,
        last_bank_account=last_bank_account,
    )


@router.get("/wallet/transactions", response_model=list[WalletTransactionRead])
async def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> list[WalletTransactionRead]:
    merchant = await _get_merchant_or_404(db, user.id)
    txns = await wallet_crud.get_transactions(db, merchant.id, skip=skip, limit=limit)
    return [WalletTransactionRead.model_validate(t) for t in txns]


@router.post("/wallet/withdraw", status_code=status.HTTP_201_CREATED)
async def request_withdrawal(
    body: WithdrawRequest,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> dict:
    merchant = await _get_merchant_or_404(db, user.id)
    try:
        await wallet_crud.add_transaction(
            db,
            merchant.id,
            TransactionType.withdrawal,
            body.amount,
            description=f"Withdrawal to {body.bank_name} {body.bank_account}",
            bank_name=body.bank_name,
            bank_account=body.bank_account,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    return {"message": "Withdrawal request submitted", "amount": body.amount}


# ── Promotions ────────────────────────────────────────────────────────────────

@router.get("/promotions", response_model=list[PromotionRead])
async def list_promotions(
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> list[PromotionRead]:
    merchant = await _get_merchant_or_404(db, user.id)
    promotions = await promotion_crud.get_by_merchant(db, merchant.id)
    return [PromotionRead.model_validate(p) for p in promotions]


@router.post(
    "/promotions", response_model=PromotionRead, status_code=status.HTTP_201_CREATED
)
async def create_promotion(
    body: PromotionCreate,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> PromotionRead:
    merchant = await _get_merchant_or_404(db, user.id)
    promotion = await promotion_crud.create(db, merchant.id, body)
    return PromotionRead.model_validate(promotion)


@router.patch("/promotions/{promotion_id}", response_model=PromotionRead)
async def update_promotion(
    promotion_id: int,
    body: PromotionUpdate,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> PromotionRead:
    merchant = await _get_merchant_or_404(db, user.id)
    promo_result = await db.execute(
        select(Promotion).where(Promotion.id == promotion_id).with_for_update()
    )
    promotion = promo_result.scalars().first()
    if not promotion or promotion.merchant_id != merchant.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    promotion = await promotion_crud.update(db, promotion, body)
    return PromotionRead.model_validate(promotion)


@router.delete("/promotions/{promotion_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_promotion(
    promotion_id: int,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> None:
    merchant = await _get_merchant_or_404(db, user.id)
    promo_result = await db.execute(
        select(Promotion).where(Promotion.id == promotion_id).with_for_update()
    )
    promotion = promo_result.scalar_one_or_none()
    if not promotion or promotion.merchant_id != merchant.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Promotion not found")
    await promotion_crud.delete(db, promotion)


# ── Shipping Zones ────────────────────────────────────────────────────────────

@router.get("/shipping", response_model=list[ShippingZoneRead])
async def list_shipping_zones(
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> list[ShippingZoneRead]:
    merchant = await _get_merchant_or_404(db, user.id)
    zones = await shipping_crud.get_by_merchant(db, merchant.id)
    return [ShippingZoneRead.model_validate(z) for z in zones]


@router.post(
    "/shipping", response_model=ShippingZoneRead, status_code=status.HTTP_201_CREATED
)
async def create_shipping_zone(
    body: ShippingZoneCreate,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> ShippingZoneRead:
    merchant = await _get_merchant_or_404(db, user.id)
    zone = await shipping_crud.create(db, merchant.id, body)
    return ShippingZoneRead.model_validate(zone)


@router.put("/shipping/{zone_id}", response_model=ShippingZoneRead)
async def update_shipping_zone(
    zone_id: int,
    body: ShippingZoneUpdate,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> ShippingZoneRead:
    merchant = await _get_merchant_or_404(db, user.id)
    zone_result = await db.execute(
        select(ShippingZone).where(ShippingZone.id == zone_id).with_for_update()
    )
    zone = zone_result.scalars().first()
    if not zone or zone.merchant_id != merchant.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shipping zone not found"
        )
    zone = await shipping_crud.update(db, zone, body)
    return ShippingZoneRead.model_validate(zone)


@router.delete("/shipping/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shipping_zone(
    zone_id: int,
    user: User = Depends(require_seller),
    db: AsyncSession = Depends(get_db),
) -> None:
    merchant = await _get_merchant_or_404(db, user.id)
    zone_result = await db.execute(
        select(ShippingZone).where(ShippingZone.id == zone_id).with_for_update()
    )
    zone = zone_result.scalar_one_or_none()
    if not zone or zone.merchant_id != merchant.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shipping zone not found"
        )
    await shipping_crud.delete(db, zone)


# ── Return requests ───────────────────────────────────────────────────────────

class ReturnRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_id: int
    customer_id: int
    reason: str
    status: str
    seller_note: str | None
    created_at: datetime


class ReturnNoteBody(BaseModel):
    note: str | None = Field(default=None, min_length=1)


@router.get("/returns", response_model=list[ReturnRequestRead])
async def seller_returns(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
) -> list:
    from app.crud import return_request as return_crud
    merchant_result = await db.execute(
        select(Merchant).where(Merchant.user_id == current_user.id)
    )
    merchant = merchant_result.scalars().first()
    if not merchant:
        return []
    return await return_crud.get_for_merchant(db, merchant.id)


@router.patch("/returns/{return_id}/approve", response_model=ReturnRequestRead)
async def approve_return(
    return_id: int,
    body: ReturnNoteBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
) -> ReturnRequestRead:
    from app.crud import return_request as return_crud
    from app.models.return_request import ReturnRequest, ReturnStatus
    rr_result = await db.execute(
        select(ReturnRequest).where(ReturnRequest.id == return_id).with_for_update()
    )
    rr = rr_result.scalar_one_or_none()
    if not rr:
        raise HTTPException(404, "Not found")
    if rr.status != ReturnStatus.pending:
        raise HTTPException(409, f"Return already {rr.status.value}")
    merchant_result = await db.execute(
        select(Merchant).where(Merchant.user_id == current_user.id)
    )
    merchant = merchant_result.scalars().first()
    order_result = await db.execute(
        select(Order).where(Order.id == rr.order_id).with_for_update()
    )
    order = order_result.scalar_one_or_none()
    if not merchant or not order or order.merchant_id != merchant.id:
        raise HTTPException(403, "Forbidden")
    return await return_crud.approve(db, rr, body.note)


@router.patch("/returns/{return_id}/reject", response_model=ReturnRequestRead)
async def reject_return(
    return_id: int,
    body: ReturnNoteBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
) -> ReturnRequestRead:
    from app.crud import return_request as return_crud
    from app.models.return_request import ReturnRequest, ReturnStatus
    rr_result = await db.execute(
        select(ReturnRequest).where(ReturnRequest.id == return_id).with_for_update()
    )
    rr = rr_result.scalar_one_or_none()
    if not rr:
        raise HTTPException(404, "Not found")
    if rr.status != ReturnStatus.pending:
        raise HTTPException(409, f"Return already {rr.status.value}")
    merchant_result = await db.execute(
        select(Merchant).where(Merchant.user_id == current_user.id)
    )
    merchant = merchant_result.scalars().first()
    order_result = await db.execute(
        select(Order).where(Order.id == rr.order_id).with_for_update()
    )
    order = order_result.scalar_one_or_none()
    if not merchant or not order or order.merchant_id != merchant.id:
        raise HTTPException(403, "Forbidden")
    return await return_crud.reject(db, rr, body.note)
