from __future__ import annotations

import csv
import io
import re
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import case, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.crud import merchant as merchant_crud
from app.crud import order as order_crud
from app.crud import product as product_crud
from app.deps import require_admin
from app.models.cart import CartItem
from app.models.category import Category
from app.models.chat_message import ChatMessage, MessageDirection
from app.models.merchant import Merchant, MerchantStatus
from app.models.order import Order, OrderStatus
from app.models.page_view import PageView
from app.models.product import Product, ProductStatus
from app.models.user import User, UserRole
from app.models.wallet import TransactionType, WalletTransaction
from app.schemas.admin_behavior import (
    BehaviorFunnelStage,
    BehaviorOverview,
    BehaviorStats,
    DeviceBucket,
    HourlyBucket,
    SessionSummary,
    SourceBucket,
    TopPage,
)
from app.schemas.category import CategoryRead
from app.schemas.merchant import MerchantRead
from app.schemas.order import OrderRead, OrderStatusUpdate
from app.schemas.product import ProductRead
from app.services.tracking import derive_device, derive_source

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Dashboard schemas ─────────────────────────────────────────────────────────

class DashboardMerchant(BaseModel):
    id: int
    name: str
    revenue: float
    orders: int


class DashboardOrder(BaseModel):
    id: int
    customer_name: str
    total_amount: float
    status: str
    created_at: datetime


class AdminDashboard(BaseModel):
    total_merchants: int
    total_products: int
    total_orders: int
    pending_approvals: int
    gmv_total: float
    gmv_prev_month: float
    orders_yesterday: int
    new_merchants_week: int
    top_merchants: list[DashboardMerchant]
    recent_orders: list[DashboardOrder]


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=AdminDashboard)
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> AdminDashboard:
    # Scalar counts
    merchant_count_result = await db.execute(select(func.count()).select_from(Merchant))
    total_merchants = merchant_count_result.scalar_one()

    product_count_result = await db.execute(select(func.count()).select_from(Product))
    total_products = product_count_result.scalar_one()

    order_count_result = await db.execute(select(func.count()).select_from(Order))
    total_orders = order_count_result.scalar_one()

    pending_approvals_result = await db.execute(
        select(func.count()).select_from(Product).where(Product.status == ProductStatus.pending)
    )
    pending_approvals = pending_approvals_result.scalar_one()

    gmv_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.status == OrderStatus.delivered
        )
    )
    gmv_total = float(gmv_result.scalar_one())

    # Top 5 merchants by delivered-order revenue
    top_q = (
        select(
            Merchant.id,
            Merchant.shop_name.label("name"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .join(Order, Order.merchant_id == Merchant.id)
        .where(Order.status == OrderStatus.delivered)
        .group_by(Merchant.id, Merchant.shop_name)
        .order_by(func.sum(Order.total_amount).desc())
        .limit(5)
    )
    top_result = await db.execute(top_q)
    top_merchants = [
        DashboardMerchant(
            id=row.id,
            name=row.name,
            revenue=float(row.revenue),
            orders=row.orders,
        )
        for row in top_result.all()
    ]

    # Recent 10 orders joined with customer User
    recent_q = (
        select(
            Order.id,
            Order.total_amount,
            Order.status,
            Order.created_at,
            User.full_name,
            User.email,
        )
        .join(User, User.id == Order.customer_id)
        .order_by(Order.created_at.desc())
        .limit(10)
    )
    recent_result = await db.execute(recent_q)
    recent_orders = [
        DashboardOrder(
            id=row.id,
            customer_name=row.full_name or row.email,
            total_amount=float(row.total_amount),
            status=row.status,
            created_at=row.created_at,
        )
        for row in recent_result.all()
    ]

    import sqlalchemy as sa

    today = date.today()
    first_this_month = today.replace(day=1)
    from datetime import timedelta
    first_prev_month = (first_this_month - timedelta(days=1)).replace(day=1)
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=7)

    # GMV previous month
    prev_month_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(Order.status != OrderStatus.cancelled)
        .where(Order.created_at >= first_prev_month)
        .where(Order.created_at < first_this_month)
    )
    gmv_prev_month = float(prev_month_result.scalar_one() or 0)

    # Orders yesterday
    orders_yesterday_result = await db.execute(
        select(func.count())
        .select_from(Order)
        .where(Order.status != OrderStatus.cancelled)
        .where(func.cast(Order.created_at, sa.Date) == yesterday)
    )
    orders_yesterday = int(orders_yesterday_result.scalar_one() or 0)

    # New merchants this week
    new_merchants_result = await db.execute(
        select(func.count())
        .select_from(Merchant)
        .where(func.cast(Merchant.created_at, sa.Date) >= week_ago)
    )
    new_merchants_week = int(new_merchants_result.scalar_one() or 0)

    return AdminDashboard(
        total_merchants=total_merchants,
        total_products=total_products,
        total_orders=total_orders,
        pending_approvals=pending_approvals,
        gmv_total=gmv_total,
        gmv_prev_month=gmv_prev_month,
        orders_yesterday=orders_yesterday,
        new_merchants_week=new_merchants_week,
        top_merchants=top_merchants,
        recent_orders=recent_orders,
    )


# ── AdminMerchantDetail schema ────────────────────────────────────────────────

class AdminMerchantDetail(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    shop_name: str
    slug: str
    description_vi: str | None
    description_en: str | None
    logo_url: str | None
    banner_url: str | None
    region: str | None
    tier: str
    status: str
    created_at: datetime
    updated_at: datetime
    # Computed stats
    product_count: int
    order_count: int
    monthly_revenue: float
    avg_rating: float | None


# ── Merchants ─────────────────────────────────────────────────────────────────

@router.get("/merchants", response_model=list[MerchantRead])
async def list_merchants(
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[MerchantRead]:
    merchants = await merchant_crud.get_all(db, skip=skip, limit=limit)
    return [MerchantRead.model_validate(m) for m in merchants]


@router.get("/merchants/{merchant_id}", response_model=AdminMerchantDetail)
async def get_merchant(
    merchant_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> AdminMerchantDetail:
    from sqlalchemy import extract

    result = await db.execute(select(Merchant).where(Merchant.id == merchant_id))
    merchant = result.scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")

    # product_count
    pc_result = await db.execute(
        select(func.count()).select_from(Product).where(Product.merchant_id == merchant_id)
    )
    product_count: int = pc_result.scalar_one() or 0

    # order_count — orders assigned to this merchant directly
    oc_result = await db.execute(
        select(func.count()).select_from(Order).where(Order.merchant_id == merchant_id)
    )
    order_count: int = oc_result.scalar_one() or 0

    # monthly_revenue — delivered orders this calendar month
    today = date.today()
    mr_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0))
        .where(
            Order.merchant_id == merchant_id,
            Order.status == OrderStatus.delivered,
            extract("year", Order.created_at) == today.year,
            extract("month", Order.created_at) == today.month,
        )
    )
    monthly_revenue: float = float(mr_result.scalar_one() or 0)

    # avg_rating — average of product ratings for this merchant
    ar_result = await db.execute(
        select(func.avg(Product.rating)).where(
            Product.merchant_id == merchant_id,
            Product.rating.isnot(None),
        )
    )
    avg_rating_raw = ar_result.scalar_one_or_none()
    avg_rating: float | None = (
        round(float(avg_rating_raw), 2) if avg_rating_raw is not None else None
    )

    return AdminMerchantDetail(
        id=merchant.id,
        user_id=merchant.user_id,
        shop_name=merchant.shop_name,
        slug=merchant.slug,
        description_vi=merchant.description_vi,
        description_en=merchant.description_en,
        logo_url=merchant.logo_url,
        banner_url=merchant.banner_url,
        region=merchant.region,
        tier=merchant.tier.value if hasattr(merchant.tier, "value") else str(merchant.tier),
        status=merchant.status.value if hasattr(merchant.status, "value") else str(merchant.status),
        created_at=merchant.created_at,
        updated_at=merchant.updated_at,
        product_count=product_count,
        order_count=order_count,
        monthly_revenue=monthly_revenue,
        avg_rating=avg_rating,
    )


@router.get("/merchants/{merchant_id}/products", response_model=list[ProductRead])
async def get_admin_merchant_products(
    merchant_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ProductRead]:
    result = await db.execute(select(Merchant).where(Merchant.id == merchant_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")

    products_result = await db.execute(
        select(Product)
        .where(Product.merchant_id == merchant_id)
        .order_by(Product.created_at.desc())
    )
    return [ProductRead.model_validate(p) for p in products_result.scalars().all()]


@router.patch("/merchants/{merchant_id}/approve", response_model=MerchantRead)
async def approve_merchant(
    merchant_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> MerchantRead:
    merchant = await merchant_crud.get_by_id(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")
    merchant = await merchant_crud.update_status(db, merchant, MerchantStatus.active)
    return MerchantRead.model_validate(merchant)


@router.patch("/merchants/{merchant_id}/suspend", response_model=MerchantRead)
async def suspend_merchant(
    merchant_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> MerchantRead:
    merchant = await merchant_crud.get_by_id(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")
    merchant = await merchant_crud.update_status(db, merchant, MerchantStatus.suspended)
    return MerchantRead.model_validate(merchant)


# ── Products ──────────────────────────────────────────────────────────────────

@router.get("/products", response_model=list[ProductRead])
async def list_all_products(
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[ProductRead]:
    products = await product_crud.get_all(db, skip=skip, limit=limit)
    return [ProductRead.model_validate(p) for p in products]


class BulkProductApprove(BaseModel):
    product_ids: list[int]


@router.post("/products/bulk-approve")
async def bulk_approve_products(
    body: BulkProductApprove,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> dict:
    approved = 0
    for pid in body.product_ids:
        product = await db.get(Product, pid)
        if product and product.status == ProductStatus.pending:
            product.status = ProductStatus.active
            approved += 1
    await db.commit()
    return {"approved": approved, "total": len(body.product_ids)}


@router.patch("/products/{product_id}/approve", response_model=ProductRead)
async def approve_product(
    product_id: int,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProductRead:
    from app.crud.notification import create as create_notif
    from app.models.notification import NotificationType
    from app.schemas.product import ProductUpdate

    product = await product_crud.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product = await product_crud.update(
        db, product, ProductUpdate(status=ProductStatus.active)
    )

    # Notify seller
    merchant = await db.get(Merchant, product.merchant_id)
    if merchant:
        try:
            await create_notif(
                db,
                merchant.user_id,
                NotificationType.product_approved,
                f"Sản phẩm '{product.name_vi}' đã được duyệt",
                "Sản phẩm của bạn đã được admin duyệt và hiển thị trên sàn.",
                link="/seller/products",
                reference_id=product.id,
            )
            await db.commit()
        except Exception:
            pass

    return ProductRead.model_validate(product)


# ── Orders ────────────────────────────────────────────────────────────────────

@router.get("/orders", response_model=list[OrderRead])
async def list_all_orders(
    skip: int = 0,
    limit: int = 50,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> list[OrderRead]:
    orders = await order_crud.get_all(db, skip=skip, limit=limit)
    return [OrderRead.model_validate(o) for o in orders]


@router.patch("/orders/{order_id}/status", response_model=OrderRead)
async def admin_update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> OrderRead:
    order = await order_crud.update_status_by_id(
        db, order_id, payload.status, note=payload.note,
        tracking_number=payload.tracking_number,
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return OrderRead.model_validate(order)


# ── Customers ─────────────────────────────────────────────────────────────────

@router.get("/customers")
async def list_customers(
    skip: int = 0,
    limit: int = 20,
    search: str = "",
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    q = select(User).where(User.role == UserRole.customer)
    if search:
        q = q.where(
            (User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%"))
        )
    q = q.order_by(User.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    users = result.scalars().all()

    out = []
    for u in users:
        order_count_result = await db.execute(
            select(func.count()).where(Order.customer_id == u.id)
        )
        order_count = order_count_result.scalar_one()

        spend_result = await db.execute(
            select(func.sum(Order.total_amount)).where(
                Order.customer_id == u.id,
                Order.status != OrderStatus.cancelled,
            )
        )
        total_spend = spend_result.scalar_one() or 0

        out.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "phone": u.phone,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat(),
            "order_count": order_count,
            "total_spend": float(total_spend),
        })
    return out


# ── User management ──────────────────────────────────────────────────────────

@router.patch("/users/{user_id}/suspend", status_code=204)
async def suspend_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot suspend admin users")
    target.is_active = False
    await db.commit()


@router.patch("/users/{user_id}/activate", status_code=204)
async def activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    target = await db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target.is_active = True
    await db.commit()


# ── Reports ───────────────────────────────────────────────────────────────────

@router.get("/reports/revenue")
async def revenue_report(
    date_from: str | None = None,  # YYYY-MM-DD
    date_to: str | None = None,    # YYYY-MM-DD
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    from sqlalchemy import extract

    q = select(
        extract("year", Order.created_at).label("year"),
        extract("month", Order.created_at).label("month"),
        func.sum(Order.total_amount).label("revenue"),
        func.count(Order.id).label("orders"),
    ).where(Order.status != OrderStatus.cancelled)

    if date_from:
        try:
            dt_from = datetime.strptime(date_from, "%Y-%m-%d")
            q = q.where(Order.created_at >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.strptime(date_to, "%Y-%m-%d")
            q = q.where(Order.created_at <= dt_to)
        except ValueError:
            pass

    q = q.group_by("year", "month").order_by("year", "month")
    result = await db.execute(q)
    rows = result.all()
    return [
        {
            "year": int(r.year),
            "month": int(r.month),
            "revenue": float(r.revenue or 0),
            "orders": int(r.orders),
        }
        for r in rows
    ]


@router.get("/reports/by-origin")
async def revenue_by_origin(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    from app.models.order import OrderItem
    q = (
        select(
            Product.origin.label("origin"),
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id.distinct()).label("orders"),
        )
        .join(OrderItem, Order.id == OrderItem.order_id)
        .join(Product, Product.id == OrderItem.product_id)
        .where(Order.status != OrderStatus.cancelled)
        .where(Product.origin.isnot(None))
        .group_by(Product.origin)
        .order_by(func.sum(Order.total_amount).desc())
    )
    result = await db.execute(q)
    rows = result.all()
    return [
        {"origin": r.origin, "revenue": float(r.revenue or 0), "orders": int(r.orders)}
        for r in rows
    ]


@router.get("/orders/export")
async def export_orders_csv(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> StreamingResponse:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Trạng thái", "Khách hàng ID", "Người nhận",
        "SĐT", "Địa chỉ", "Tổng tiền", "Ghi chú", "Ngày tạo",
    ])
    for o in orders:
        addr = o.shipping_address or {}
        writer.writerow([
            o.id,
            o.status.value,
            o.customer_id,
            addr.get("name", ""),
            addr.get("phone", ""),
            f"{addr.get('address', '')}, {addr.get('city', '')}",
            float(o.total_amount),
            o.notes or "",
            o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
        ])

    content = output.getvalue().encode("utf-8-sig")
    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=orders.csv"},
    )


@router.get("/customers/export")
async def export_customers_csv(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> StreamingResponse:
    result = await db.execute(
        select(
            User.id,
            User.email,
            User.full_name,
            User.phone,
            User.is_active,
            User.created_at,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(
                case((Order.status == OrderStatus.delivered, Order.total_amount), else_=0)
            ), 0).label("total_spend"),
        )
        .outerjoin(Order, Order.customer_id == User.id)
        .where(User.role == UserRole.customer)
        .group_by(User.id)
        .order_by(User.created_at.desc())
    )
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Email", "Họ tên", "SĐT",
        "Trạng thái", "Số đơn", "Tổng chi (VNĐ)", "Ngày đăng ký",
    ])
    for r in rows:
        writer.writerow([
            r.id, r.email, r.full_name or "", r.phone or "",
            "Hoạt động" if r.is_active else "Đã khóa",
            r.order_count, float(r.total_spend),
            r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
        ])

    content = output.getvalue().encode("utf-8-sig")
    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=customers.csv"},
    )


# ── Platform Settings ──────────────────────────────────────────────────────────

class ConfigItem(BaseModel):
    key: str
    value: str
    description: str | None = None


@router.get("/settings", response_model=list[ConfigItem], summary="Get platform settings")
async def get_settings(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ConfigItem]:
    from app.models.platform_config import PlatformConfig
    result = await db.execute(select(PlatformConfig))
    configs = result.scalars().all()
    return [ConfigItem(key=c.key, value=c.value, description=c.description) for c in configs]


@router.put("/settings", response_model=list[ConfigItem], summary="Save platform settings")
async def save_settings(
    items: list[ConfigItem],
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ConfigItem]:
    from app.models.platform_config import PlatformConfig
    for item in items:
        existing = await db.get(PlatformConfig, item.key)
        if existing:
            existing.value = item.value
            if item.description is not None:
                existing.description = item.description
        else:
            db.add(PlatformConfig(key=item.key, value=item.value, description=item.description))
    await db.commit()
    result = await db.execute(select(PlatformConfig))
    configs = result.scalars().all()
    return [ConfigItem(key=c.key, value=c.value, description=c.description) for c in configs]


@router.get("/integrations")
async def integration_health(user: User = Depends(require_admin)) -> list[dict]:
    return [
        {"name": "VCB VietQR", "status": "online", "uptime": 99.8},
        {"name": "DHL Express", "status": "online", "uptime": 100.0},
        {"name": "Meta Messenger", "status": "degraded", "uptime": 94.2},
        {"name": "Zalo OA", "status": "online", "uptime": 98.1},
    ]


# ── Category management ────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name_vi: str
    name_en: str
    slug: str
    parent_id: int | None = None
    icon_url: str | None = None
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name_vi: str | None = None
    name_en: str | None = None
    slug: str | None = None
    icon_url: str | None = None
    sort_order: int | None = None


class CategoryWithCount(CategoryRead):
    product_count: int


@router.get("/categories", response_model=list[CategoryWithCount])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list:
    result = await db.execute(
        select(Category).order_by(Category.sort_order, Category.id)
    )
    categories = result.scalars().all()
    out = []
    for cat in categories:
        count_res = await db.execute(
            select(func.count()).select_from(Product).where(
                Product.category_id == cat.id
            )
        )
        out.append(
            CategoryWithCount(
                **CategoryRead.model_validate(cat).model_dump(),
                product_count=count_res.scalar_one(),
            )
        )
    return out


@router.post("/categories", response_model=CategoryRead, status_code=201)
async def create_category(
    body: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Category:
    cat = Category(**body.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.put("/categories/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: int,
    body: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Category:
    cat = await db.get(Category, category_id)
    if not cat:
        raise HTTPException(404, "Category not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    cat = await db.get(Category, category_id)
    if not cat:
        raise HTTPException(404, "Category not found")
    count_res = await db.execute(
        select(func.count()).select_from(Product).where(
            Product.category_id == category_id
        )
    )
    if count_res.scalar_one() > 0:
        raise HTTPException(409, "Danh mục có sản phẩm, không thể xóa")
    await db.delete(cat)
    await db.commit()


# ── Return requests (admin view) ───────────────────────────────────────────────

@router.get("/returns")
async def list_returns(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[dict]:
    from app.crud import return_request as return_crud
    items = await return_crud.get_all(db)
    return [
        {
            "id": r.id,
            "order_id": r.order_id,
            "customer_id": r.customer_id,
            "reason": r.reason,
            "status": r.status.value,
            "seller_note": r.seller_note,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in items
    ]


# ── Withdrawals ───────────────────────────────────────────────────────────────

# Note: WalletTransaction has no dedicated status column.
# Approval state is tracked via sentinel suffixes in the description field:
#   "[Đã duyệt bởi admin]"  → approved
#   "[Đã từ chối bởi admin]" → rejected
#   (neither)               → pending

class WithdrawalRead(BaseModel):
    id: int
    merchant_id: int
    merchant_name: str
    amount: float
    status: str  # "pending" | "approved" | "rejected"
    description: str | None
    created_at: datetime


def _withdrawal_status(description: str | None) -> str:
    if description is None:
        return "pending"
    if "[Đã duyệt bởi admin]" in description:
        return "approved"
    if "[Đã từ chối bởi admin]" in description:
        return "rejected"
    return "pending"


async def _enrich_withdrawal(db: AsyncSession, txn: WalletTransaction) -> WithdrawalRead:
    merchant_result = await db.execute(select(Merchant).where(Merchant.id == txn.merchant_id))
    merchant = merchant_result.scalar_one_or_none()
    return WithdrawalRead(
        id=txn.id,
        merchant_id=txn.merchant_id,
        merchant_name=merchant.shop_name if merchant else "Unknown",
        amount=abs(float(txn.amount)),
        status=_withdrawal_status(txn.description),
        description=txn.description,
        created_at=txn.created_at,
    )


@router.get("/withdrawals", response_model=list[WithdrawalRead])
async def list_withdrawals(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[WithdrawalRead]:
    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.type == TransactionType.withdrawal)
        .order_by(WalletTransaction.created_at.desc())
    )
    transactions = result.scalars().all()
    enriched = []
    for txn in transactions:
        enriched.append(await _enrich_withdrawal(db, txn))
    return enriched


@router.patch("/withdrawals/{txn_id}/approve", response_model=WithdrawalRead)
async def approve_withdrawal(
    txn_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> WithdrawalRead:
    from app.crud.notification import create as create_notif
    from app.models.notification import NotificationType

    txn = await db.get(WalletTransaction, txn_id)
    if not txn or txn.type != TransactionType.withdrawal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Withdrawal not found")
    current_desc = txn.description or ""
    if "[Đã duyệt bởi admin]" in current_desc or "[Đã từ chối bởi admin]" in current_desc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Withdrawal has already been processed",
        )
    txn.description = current_desc + " [Đã duyệt bởi admin]"
    await db.commit()
    await db.refresh(txn)

    # Notify seller
    merchant = await db.execute(select(Merchant).where(Merchant.id == txn.merchant_id))
    merchant_obj = merchant.scalar_one_or_none()
    if merchant_obj:
        try:
            await create_notif(
                db,
                merchant_obj.user_id,
                NotificationType.withdrawal_approved,
                "Yêu cầu rút tiền đã được duyệt",
                f"Yêu cầu rút {abs(float(txn.amount)):,.0f}₫ đã được admin phê duyệt.",
                link="/seller/wallet",
            )
            await db.commit()
        except Exception:
            pass

    return await _enrich_withdrawal(db, txn)


@router.patch("/withdrawals/{txn_id}/reject", response_model=WithdrawalRead)
async def reject_withdrawal(
    txn_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> WithdrawalRead:
    from app.crud.notification import create as create_notif
    from app.models.notification import NotificationType

    txn = await db.get(WalletTransaction, txn_id)
    if not txn or txn.type != TransactionType.withdrawal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Withdrawal not found")
    current_desc = txn.description or ""
    if "[Đã duyệt bởi admin]" in current_desc or "[Đã từ chối bởi admin]" in current_desc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Withdrawal has already been processed",
        )
    txn.description = current_desc + " [Đã từ chối bởi admin]"
    await db.commit()
    await db.refresh(txn)

    # Notify seller
    merchant = await db.execute(select(Merchant).where(Merchant.id == txn.merchant_id))
    merchant_obj = merchant.scalar_one_or_none()
    if merchant_obj:
        try:
            await create_notif(
                db,
                merchant_obj.user_id,
                NotificationType.withdrawal_rejected,
                "Yêu cầu rút tiền bị từ chối",
                f"Yêu cầu rút {abs(float(txn.amount)):,.0f}₫ đã bị admin từ chối.",
                link="/seller/wallet",
            )
            await db.commit()
        except Exception:
            pass

    return await _enrich_withdrawal(db, txn)


# ── CRM: Chat conversations ───────────────────────────────────────────────────


class ChatMessageOut(BaseModel):
    id: int
    direction: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationSummary(BaseModel):
    fb_user_id: str
    session_id: str
    message_count: int
    last_message: str
    last_activity: datetime


@router.get("/crm/conversations", response_model=list[ConversationSummary])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ConversationSummary]:
    result = await db.execute(
        select(
            ChatMessage.fb_user_id,
            ChatMessage.session_id,
            func.count(ChatMessage.id).label("message_count"),
            func.max(ChatMessage.created_at).label("last_activity"),
        )
        .group_by(ChatMessage.fb_user_id, ChatMessage.session_id)
        .order_by(func.max(ChatMessage.created_at).desc())
    )
    rows = result.all()

    summaries: list[ConversationSummary] = []
    for row in rows:
        last = await db.execute(
            select(ChatMessage.content)
            .where(ChatMessage.session_id == row.session_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        last_content = last.scalar_one_or_none() or ""
        summaries.append(ConversationSummary(
            fb_user_id=row.fb_user_id,
            session_id=row.session_id,
            message_count=row.message_count,
            last_message=last_content[:80],
            last_activity=row.last_activity,
        ))
    return summaries


@router.get("/crm/conversations/{session_id}", response_model=list[ChatMessageOut])
async def get_conversation(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[ChatMessageOut]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return result.scalars().all()


# ── CRM Analytics ─────────────────────────────────────────────────────────────

class CRMStats(BaseModel):
    messenger_contacts: int
    total_customers: int
    new_this_month: int
    buyers: int
    repeat_buyers: int
    avg_order_value: float


class FunnelStage(BaseModel):
    stage: str
    key: str
    count: int


class SegmentCount(BaseModel):
    new_customers: int
    returning: int
    at_risk: int
    no_order: int


class CustomerRow(BaseModel):
    id: int
    email: str
    full_name: str | None
    phone: str | None
    created_at: datetime
    order_count: int
    last_order_date: datetime | None
    total_spent: float
    segment: str


class OrderSummary(BaseModel):
    id: int
    status: str
    total_amount: float
    created_at: datetime


class CustomerDetail(BaseModel):
    id: int
    email: str
    full_name: str | None
    phone: str | None
    created_at: datetime
    order_count: int
    total_spent: float
    segment: str
    orders: list[OrderSummary]


def _derive_segment(
    order_count: int, last_order_date: datetime | None, created_at: datetime
) -> str:
    now = datetime.utcnow()
    if order_count >= 2:
        return "returning"
    if order_count == 1 and last_order_date and (now - last_order_date).days > 60:
        return "at_risk"
    if (now - created_at).days <= 30:
        return "new"
    return "no_order"


@router.get("/crm/stats", response_model=CRMStats)
async def get_crm_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> CRMStats:
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    messenger_contacts = (await db.execute(
        select(func.count(distinct(ChatMessage.fb_user_id)))
    )).scalar_one() or 0

    total_customers = (await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.customer)
    )).scalar_one() or 0

    new_this_month = (await db.execute(
        select(func.count(User.id))
        .where(User.role == UserRole.customer)
        .where(User.created_at >= thirty_days_ago)
    )).scalar_one() or 0

    buyers = (await db.execute(
        select(func.count(distinct(Order.customer_id)))
    )).scalar_one() or 0

    repeat_sq = (
        select(Order.customer_id)
        .group_by(Order.customer_id)
        .having(func.count(Order.id) >= 2)
        .subquery()
    )
    repeat_buyers = (await db.execute(
        select(func.count()).select_from(repeat_sq)
    )).scalar_one() or 0

    avg_order_value = (await db.execute(
        select(func.avg(Order.total_amount))
        .where(Order.status == OrderStatus.delivered)
    )).scalar_one() or 0.0

    return CRMStats(
        messenger_contacts=messenger_contacts,
        total_customers=total_customers,
        new_this_month=new_this_month,
        buyers=buyers,
        repeat_buyers=repeat_buyers,
        avg_order_value=float(avg_order_value),
    )


@router.get("/crm/funnel", response_model=list[FunnelStage])
async def get_crm_funnel(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[FunnelStage]:
    messenger_contacts = (await db.execute(
        select(func.count(distinct(ChatMessage.fb_user_id)))
    )).scalar_one() or 0

    total_customers = (await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.customer)
    )).scalar_one() or 0

    buyers = (await db.execute(
        select(func.count(distinct(Order.customer_id)))
    )).scalar_one() or 0

    repeat_sq = (
        select(Order.customer_id)
        .group_by(Order.customer_id)
        .having(func.count(Order.id) >= 2)
        .subquery()
    )
    repeat_buyers = (await db.execute(
        select(func.count()).select_from(repeat_sq)
    )).scalar_one() or 0

    return [
        FunnelStage(stage="Liên hệ Messenger", key="messenger", count=messenger_contacts),
        FunnelStage(stage="Đã đăng ký", key="registered", count=total_customers),
        FunnelStage(stage="Đã đặt hàng", key="buyers", count=buyers),
        FunnelStage(stage="Khách quay lại", key="repeat", count=repeat_buyers),
    ]


@router.get("/crm/segments", response_model=SegmentCount)
async def get_crm_segments(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> SegmentCount:
    result = await db.execute(
        select(
            User.id,
            User.created_at,
            func.count(Order.id).label("order_count"),
            func.max(Order.created_at).label("last_order_date"),
        )
        .outerjoin(Order, Order.customer_id == User.id)
        .where(User.role == UserRole.customer)
        .group_by(User.id, User.created_at)
    )
    rows = result.all()

    counts = {"returning": 0, "at_risk": 0, "new": 0, "no_order": 0}
    for row in rows:
        seg = _derive_segment(row.order_count, row.last_order_date, row.created_at)
        counts[seg] += 1

    return SegmentCount(
        new_customers=counts["new"],
        returning=counts["returning"],
        at_risk=counts["at_risk"],
        no_order=counts["no_order"],
    )


@router.get("/crm/customers", response_model=list[CustomerRow])
async def list_crm_customers(
    segment: str | None = None,
    q: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[CustomerRow]:
    stmt = (
        select(
            User.id,
            User.email,
            User.full_name,
            User.phone,
            User.created_at,
            func.count(Order.id).label("order_count"),
            func.max(Order.created_at).label("last_order_date"),
            func.coalesce(func.sum(Order.total_amount), 0).label("total_spent"),
        )
        .outerjoin(Order, Order.customer_id == User.id)
        .where(User.role == UserRole.customer)
        .group_by(User.id, User.email, User.full_name, User.phone, User.created_at)
        .order_by(func.max(Order.created_at).desc().nullslast(), User.created_at.desc())
    )

    if q:
        like = f"%{q}%"
        stmt = stmt.where((User.email.ilike(like)) | (User.full_name.ilike(like)))

    result = await db.execute(stmt)
    rows = result.all()

    customers: list[CustomerRow] = []
    for row in rows:
        seg = _derive_segment(row.order_count, row.last_order_date, row.created_at)
        if segment and seg != segment:
            continue
        customers.append(CustomerRow(
            id=row.id,
            email=row.email,
            full_name=row.full_name,
            phone=row.phone,
            created_at=row.created_at,
            order_count=row.order_count,
            last_order_date=row.last_order_date,
            total_spent=float(row.total_spent),
            segment=seg,
        ))

    return customers[skip: skip + limit]


@router.get("/crm/customers/{user_id}", response_model=CustomerDetail)
async def get_crm_customer(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> CustomerDetail:
    user = await db.get(User, user_id)
    if not user or user.role != UserRole.customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    result = await db.execute(
        select(Order)
        .where(Order.customer_id == user_id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    total_spent = sum(float(o.total_amount) for o in orders)
    last_order_date = orders[0].created_at if orders else None
    seg = _derive_segment(len(orders), last_order_date, user.created_at)

    return CustomerDetail(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        created_at=user.created_at,
        order_count=len(orders),
        total_spent=total_spent,
        segment=seg,
        orders=[
            OrderSummary(
                id=o.id,
                status=o.status,
                total_amount=float(o.total_amount),
                created_at=o.created_at,
            )
            for o in orders
        ],
    )


# ── CRM Demographics + Conversation analytics ─────────────────────────────────

_INTENT_KEYWORDS: dict[str, list[str]] = {
    "product_search": [
        "sản phẩm", "tìm", "có loại", "có món", "menu", "danh mục", "loại nào", "còn hàng",
    ],
    "price_inquiry": [
        "giá", "bao nhiêu", "mắc", "rẻ", "khuyến mãi", "giảm giá", "sale",
    ],
    "order_lookup": [
        "đơn hàng", "đặt hàng", "đơn của", "tracking", "vận đơn", "mã đơn", "tra đơn",
    ],
    "shipping_inquiry": [
        "ship", "vận chuyển", "giao hàng", "phí ship", "bao lâu", "khi nào nhận",
    ],
    "complaint": [
        "khiếu nại", "phản hồi", "không hài lòng", "hỏng", "sai", "lỗi", "tệ", "đổi trả",
    ],
}

_INTENT_LABELS = {
    "product_search": "Tìm sản phẩm",
    "price_inquiry": "Hỏi giá",
    "order_lookup": "Tra đơn",
    "shipping_inquiry": "Hỏi vận chuyển",
    "complaint": "Phản hồi/Khiếu nại",
}

_VN_LOCATION_HINTS = (
    "hà nội", "ha noi", "hồ chí minh", "ho chi minh", "tphcm", "tp.hcm", "tp hcm",
    "đà nẵng", "da nang", "hải phòng", "hai phong", "cần thơ", "can tho",
    "huế", "hue", "nha trang", "vũng tàu", "vung tau", "biên hòa", "bien hoa",
    "vietnam", "việt nam", "vn",
)


def _classify_intent(text: str) -> str | None:
    if not text:
        return None
    lower = text.lower()
    for intent, keywords in _INTENT_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return intent
    return None


def _is_vn_address(addr: dict | None) -> bool:
    if not addr:
        return False
    country = addr.get("country") if isinstance(addr, dict) else None
    if isinstance(country, str) and country.strip().lower() in {"vn", "vietnam", "việt nam"}:
        return True
    blob = " ".join(str(v) for v in addr.values() if v).lower()
    return any(hint in blob for hint in _VN_LOCATION_HINTS)


class DemographicBucket(BaseModel):
    label: str
    key: str
    count: int


class Demographics(BaseModel):
    by_source: list[DemographicBucket]
    by_country: list[DemographicBucket]
    by_device: list[DemographicBucket]


@router.get("/crm/demographics", response_model=Demographics)
async def get_crm_demographics(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> Demographics:
    messenger_count = (await db.execute(
        select(func.count(distinct(ChatMessage.fb_user_id)))
    )).scalar_one() or 0

    total_users = (await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.customer)
    )).scalar_one() or 0

    buyers = (await db.execute(
        select(func.count(distinct(Order.customer_id)))
    )).scalar_one() or 0

    leads = max(total_users - buyers, 0)

    by_source = [
        DemographicBucket(label="Messenger", key="messenger", count=messenger_count),
        DemographicBucket(label="Web (đã mua)", key="web", count=buyers),
        DemographicBucket(label="Đăng ký chưa mua", key="lead", count=leads),
    ]

    orders_res = await db.execute(select(Order.customer_id, Order.shipping_address))
    vn_customers: set[int] = set()
    other_customers: set[int] = set()
    for cust_id, addr in orders_res.all():
        if _is_vn_address(addr):
            vn_customers.add(cust_id)
        else:
            other_customers.add(cust_id)
    other_only = other_customers - vn_customers

    by_country = [
        DemographicBucket(label="Việt Nam", key="vn", count=len(vn_customers)),
        DemographicBucket(label="Khác", key="other", count=len(other_only)),
    ]

    return Demographics(by_source=by_source, by_country=by_country, by_device=[])


class ConversationStats(BaseModel):
    total_today: int
    total_messages_today: int
    response_time_avg: float | None
    conversion_rate: float | None


class IntentBucket(BaseModel):
    key: str
    label: str
    count: int


class TrendPoint(BaseModel):
    date: date
    count: int


class ConversationOverview(BaseModel):
    stats: ConversationStats
    intent_breakdown: list[IntentBucket]
    trend_7d: list[TrendPoint]
    funnel: list[FunnelStage]


_PHONE_RE = re.compile(r"0\d{9,10}")
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")


@router.get("/crm/conversation-overview", response_model=ConversationOverview)
async def get_conversation_overview(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> ConversationOverview:
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    seven_days_ago = today_start - timedelta(days=6)
    thirty_days_ago = now - timedelta(days=30)

    total_today = (await db.execute(
        select(func.count(distinct(ChatMessage.fb_user_id)))
        .where(ChatMessage.created_at >= today_start)
    )).scalar_one() or 0

    total_messages_today = (await db.execute(
        select(func.count(ChatMessage.id))
        .where(ChatMessage.created_at >= today_start)
    )).scalar_one() or 0

    inbound_res = await db.execute(
        select(ChatMessage.session_id, ChatMessage.content, ChatMessage.created_at)
        .where(ChatMessage.direction == MessageDirection.inbound)
        .where(ChatMessage.created_at >= thirty_days_ago)
    )
    intent_counts: dict[str, int] = dict.fromkeys(_INTENT_KEYWORDS, 0)
    product_sessions: set[str] = set()
    phone_sessions_map: dict[str, set[str]] = {}
    for sid, content, _created in inbound_res.all():
        intent = _classify_intent(content or "")
        if intent:
            intent_counts[intent] += 1
            if intent in {"product_search", "price_inquiry"}:
                product_sessions.add(sid)
        if content:
            for phone in _PHONE_RE.findall(content):
                phone_sessions_map.setdefault(sid, set()).add(phone)

    intent_breakdown = [
        IntentBucket(key=k, label=_INTENT_LABELS[k], count=intent_counts[k])
        for k in _INTENT_KEYWORDS
    ]

    trend_res = await db.execute(
        select(
            func.date(ChatMessage.created_at).label("day"),
            func.count(ChatMessage.id).label("cnt"),
        )
        .where(ChatMessage.created_at >= seven_days_ago)
        .group_by(func.date(ChatMessage.created_at))
    )
    trend_map: dict = {}
    for row in trend_res.all():
        key = row.day
        if isinstance(key, str):
            try:
                key = date.fromisoformat(key)
            except ValueError:
                continue
        trend_map[key] = row.cnt
    trend_7d = [
        TrendPoint(
            date=(seven_days_ago + timedelta(days=i)).date(),
            count=trend_map.get((seven_days_ago + timedelta(days=i)).date(), 0),
        )
        for i in range(7)
    ]

    total_conversations = (await db.execute(
        select(func.count(distinct(ChatMessage.session_id)))
    )).scalar_one() or 0

    linked_count = 0
    if phone_sessions_map:
        all_phones = {p for phones in phone_sessions_map.values() for p in phones}
        buyer_phones_res = await db.execute(
            select(distinct(User.phone))
            .join(Order, Order.customer_id == User.id)
            .where(User.phone.in_(all_phones))
        )
        buyer_phones = {p for (p,) in buyer_phones_res.all() if p}
        linked_count = sum(
            1 for phones in phone_sessions_map.values() if phones & buyer_phones
        )

    funnel = [
        FunnelStage(stage="Tổng hội thoại", key="total", count=total_conversations),
        FunnelStage(stage="Có ý định mua", key="product_intent", count=len(product_sessions)),
        FunnelStage(stage="Gắn với đơn hàng", key="linked_to_order", count=linked_count),
    ]

    return ConversationOverview(
        stats=ConversationStats(
            total_today=total_today,
            total_messages_today=total_messages_today,
            response_time_avg=None,
            conversion_rate=None,
        ),
        intent_breakdown=intent_breakdown,
        trend_7d=trend_7d,
        funnel=funnel,
    )


class LinkedUser(BaseModel):
    id: int
    full_name: str | None
    phone: str | None
    email: str
    total_spent: float
    order_count: int


class IntentHistoryItem(BaseModel):
    key: str
    label: str
    count: int


class ConversationProfile(BaseModel):
    session_id: str
    fb_user_id: str
    linked_user: LinkedUser | None
    first_seen: datetime
    last_seen: datetime
    message_count: int
    intent_history: list[IntentHistoryItem]


@router.get("/crm/conversations/{session_id}/profile", response_model=ConversationProfile)
async def get_conversation_profile(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> ConversationProfile:
    msgs_res = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    msgs = msgs_res.scalars().all()
    if not msgs:
        raise HTTPException(status_code=404, detail="Conversation not found")

    counts: dict[str, int] = dict.fromkeys(_INTENT_KEYWORDS, 0)
    found_phones: set[str] = set()
    found_emails: set[str] = set()
    for m in msgs:
        if m.direction != MessageDirection.inbound:
            continue
        intent = _classify_intent(m.content or "")
        if intent:
            counts[intent] += 1
        if m.content:
            for p in _PHONE_RE.findall(m.content):
                found_phones.add(p)
            for e in _EMAIL_RE.findall(m.content):
                found_emails.add(e.lower())

    intent_history = [
        IntentHistoryItem(key=k, label=_INTENT_LABELS[k], count=counts[k])
        for k in _INTENT_KEYWORDS if counts[k] > 0
    ]

    linked_user_obj: User | None = None
    if found_phones:
        u_res = await db.execute(
            select(User).where(User.phone.in_(found_phones)).limit(1)
        )
        linked_user_obj = u_res.scalar_one_or_none()
    if linked_user_obj is None and found_emails:
        u_res = await db.execute(
            select(User).where(func.lower(User.email).in_(found_emails)).limit(1)
        )
        linked_user_obj = u_res.scalar_one_or_none()

    linked: LinkedUser | None = None
    if linked_user_obj is not None:
        ord_res = await db.execute(
            select(
                func.count(Order.id),
                func.coalesce(func.sum(Order.total_amount), 0),
            ).where(Order.customer_id == linked_user_obj.id)
        )
        order_count, total_spent = ord_res.one()
        linked = LinkedUser(
            id=linked_user_obj.id,
            full_name=linked_user_obj.full_name,
            phone=linked_user_obj.phone,
            email=linked_user_obj.email,
            total_spent=float(total_spent),
            order_count=int(order_count),
        )

    return ConversationProfile(
        session_id=session_id,
        fb_user_id=msgs[0].fb_user_id,
        linked_user=linked,
        first_seen=msgs[0].created_at,
        last_seen=msgs[-1].created_at,
        message_count=len(msgs),
        intent_history=intent_history,
    )


# ── Behavior (page tracking) ──────────────────────────────────────────────────


def _parse_day(value: str | None) -> date:
    if not value:
        return date.today()
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date — expected YYYY-MM-DD",
        ) from exc


@router.get("/behavior/overview", response_model=BehaviorOverview)
async def get_behavior_overview(
    date: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> BehaviorOverview:
    day = _parse_day(date)
    start = datetime.combine(day, datetime.min.time())
    end = datetime.combine(day, datetime.max.time())

    rows = (
        await db.execute(
            select(PageView)
            .where(PageView.viewed_at >= start, PageView.viewed_at <= end)
            .order_by(PageView.viewed_at.asc())
        )
    ).scalars().all()

    sessions: dict[str, list[PageView]] = {}
    for pv in rows:
        sessions.setdefault(pv.session_id, []).append(pv)

    total_sessions = len(sessions)
    bounce_rate: float | None = None
    avg_duration_sec: float | None = None
    pages_per_session: float | None = None
    if total_sessions:
        bounced = sum(1 for pvs in sessions.values() if len(pvs) <= 1)
        bounce_rate = round(bounced / total_sessions, 4)
        durations = [
            (pvs[-1].viewed_at - pvs[0].viewed_at).total_seconds()
            for pvs in sessions.values()
            if len(pvs) > 1
        ]
        avg_duration_sec = round(sum(durations) / len(durations), 2) if durations else 0.0
        pages_per_session = round(len(rows) / total_sessions, 2)

    device_counts: dict[str, int] = {"mobile": 0, "desktop": 0, "tablet": 0, "unknown": 0}
    source_counts: dict[str, int] = {"direct": 0, "google": 0, "facebook": 0, "other": 0}
    path_counts: dict[str, int] = {}
    hourly_counts: dict[int, int] = dict.fromkeys(range(24), 0)
    for pv in rows:
        device_counts[derive_device(pv.user_agent)] += 1
        source_counts[derive_source(pv.referrer)] += 1
        path_counts[pv.path] = path_counts.get(pv.path, 0) + 1
        hourly_counts[pv.viewed_at.hour] = hourly_counts.get(pv.viewed_at.hour, 0) + 1

    top_pages_sorted = sorted(path_counts.items(), key=lambda kv: kv[1], reverse=True)[:10]

    view_product = len({pv.visitor_id for pv in rows if pv.path.startswith("/product/")})
    checkout = len({pv.visitor_id for pv in rows if pv.path.startswith("/checkout")})

    cart_users = (
        await db.execute(select(func.count(distinct(CartItem.customer_id))))
    ).scalar_one() or 0

    complete = (
        await db.execute(
            select(func.count(distinct(Order.customer_id))).where(
                Order.created_at >= start,
                Order.created_at <= end,
                Order.status != OrderStatus.cancelled,
            )
        )
    ).scalar_one() or 0

    return BehaviorOverview(
        stats=BehaviorStats(
            total_sessions=total_sessions,
            bounce_rate=bounce_rate,
            avg_duration_sec=avg_duration_sec,
            pages_per_session=pages_per_session,
        ),
        by_device=[DeviceBucket(key=k, count=v) for k, v in device_counts.items() if v > 0]
        or [DeviceBucket(key="unknown", count=0)],
        by_source=[SourceBucket(key=k, count=v) for k, v in source_counts.items() if v > 0]
        or [SourceBucket(key="direct", count=0)],
        top_pages=[TopPage(path=p, count=c) for p, c in top_pages_sorted],
        funnel=[
            BehaviorFunnelStage(key="view_product", count=view_product),
            BehaviorFunnelStage(key="add_to_cart", count=int(cart_users)),
            BehaviorFunnelStage(key="checkout", count=checkout),
            BehaviorFunnelStage(key="complete", count=int(complete)),
        ],
        hourly_24h=[HourlyBucket(hour=h, count=hourly_counts[h]) for h in range(24)],
    )


@router.get("/behavior/sessions", response_model=list[SessionSummary])
async def list_behavior_sessions(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[SessionSummary]:
    if limit < 1 or limit > 200:
        raise HTTPException(status_code=400, detail="limit must be 1..200")
    if offset < 0:
        raise HTTPException(status_code=400, detail="offset must be >= 0")

    agg = (
        await db.execute(
            select(
                PageView.session_id,
                func.min(PageView.visitor_id).label("visitor_id"),
                func.max(PageView.user_id).label("user_id"),
                func.count(PageView.id).label("page_count"),
                func.min(PageView.viewed_at).label("first_seen"),
                func.max(PageView.viewed_at).label("last_seen"),
            )
            .group_by(PageView.session_id)
            .order_by(func.max(PageView.viewed_at).desc())
            .limit(limit)
            .offset(offset)
        )
    ).all()

    out: list[SessionSummary] = []
    for r in agg:
        if r.first_seen and r.last_seen:
            duration = int((r.last_seen - r.first_seen).total_seconds())
        else:
            duration = 0
        out.append(SessionSummary(
            session_id=r.session_id,
            visitor_id=r.visitor_id,
            user_id=r.user_id,
            page_count=int(r.page_count),
            duration_sec=duration,
            first_seen=r.first_seen,
            last_seen=r.last_seen,
        ))
    return out
