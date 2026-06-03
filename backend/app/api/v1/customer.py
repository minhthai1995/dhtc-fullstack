from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.crud import cart as cart_crud
from app.crud import category as category_crud
from app.crud import merchant as merchant_crud
from app.crud import order as order_crud
from app.crud import order_event as event_crud
from app.crud import product as product_crud
from app.crud import review as review_crud
from app.crud import shipping as shipping_crud
from app.crud import user_address as address_crud
from app.crud import wishlist as wishlist_crud
from app.deps import current_user, require_customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product, ProductStatus
from app.models.promotion import Promotion, PromotionType
from app.models.review import Review
from app.models.user import User
from app.models.user_address import UserAddress
from app.models.wishlist import WishlistItem
from app.schemas.cart import AddToCart, CartItemRead, UpdateCartItem
from app.schemas.category import CategoryRead
from app.schemas.merchant import MerchantRead
from app.schemas.order import CreateOrder, OrderDetail, OrderEventRead, OrderRead
from app.schemas.product import ProductRead
from app.schemas.promotion import CouponValidateRequest, CouponValidateResponse
from app.schemas.review import ReviewCreate, ReviewRead
from app.schemas.shipping import ShippingZoneRead
from app.schemas.user import UserRead, UserUpdate
from app.schemas.user_address import AddressCreate, AddressRead
from app.schemas.wishlist import WishlistItemRead

# ── Profile schemas ───────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    id: int
    full_name: str | None
    email: str
    phone: str | None


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    phone: str | None = Field(default=None, min_length=1, max_length=20)

router = APIRouter(prefix="/customer", tags=["customer"])


# ── Categories (public) ───────────────────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryRead])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[CategoryRead]:
    categories = await category_crud.get_all(db)
    return [CategoryRead.model_validate(c) for c in categories]


# ── Products (public) ─────────────────────────────────────────────────────────

@router.get("/products", response_model=list[ProductRead])
async def list_products(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    category_id: int | None = None,
    merchant_id: int | None = None,
    search: str | None = Query(default=None, max_length=200),
    sort_by: str | None = Query(default=None, max_length=50),
    min_price: float | None = None,
    max_price: float | None = None,
    min_rating: float | None = None,
    certification: str | None = Query(default=None, max_length=200),
    origin: str | None = Query(default=None, max_length=100),
    db: AsyncSession = Depends(get_db),
) -> list[ProductRead]:
    products = await product_crud.get_all_public(
        db,
        skip=skip,
        limit=limit,
        category_id=category_id,
        merchant_id=merchant_id,
        search=search,
        sort_by=sort_by,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        certification=certification,
        origin=origin,
    )
    return [ProductRead.model_validate(p) for p in products]


@router.get("/products/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
) -> ProductRead:
    product = await product_crud.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ProductRead.model_validate(product)


@router.get("/products/{product_id}/related", response_model=list[ProductRead])
async def get_related_products(
    product_id: int,
    db: AsyncSession = Depends(get_db),
) -> list[ProductRead]:
    product = await product_crud.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    result = await db.execute(
        select(Product)
        .where(
            Product.category_id == product.category_id,
            Product.id != product_id,
            Product.status == ProductStatus.active,
        )
        .order_by(Product.sold_count.desc())
        .limit(4)
    )
    products = result.scalars().all()
    return [ProductRead.model_validate(p) for p in products]


# ── Merchants (public) ────────────────────────────────────────────────────────

@router.get("/merchants", response_model=list[MerchantRead])
async def list_merchants(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> list[MerchantRead]:
    from app.models.merchant import MerchantStatus

    merchants = await merchant_crud.get_all(
        db, skip=skip, limit=limit, status=MerchantStatus.active
    )
    return [MerchantRead.model_validate(m) for m in merchants]


@router.get("/merchants/{merchant_id}", response_model=MerchantRead)
async def get_merchant(
    merchant_id: int,
    db: AsyncSession = Depends(get_db),
) -> MerchantRead:
    merchant = await merchant_crud.get_by_id(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")
    return MerchantRead.model_validate(merchant)


# ── Shipping (public) ─────────────────────────────────────────────────────────

@router.get(
    "/merchants/{merchant_id}/shipping",
    response_model=list[ShippingZoneRead],
)
async def list_merchant_shipping_zones(
    merchant_id: int,
    country: str | None = Query(default=None, max_length=100),
    db: AsyncSession = Depends(get_db),
) -> list[ShippingZoneRead]:
    """Return shipping zones for a merchant. Optional ``country`` filter (case-insensitive)."""
    merchant = await merchant_crud.get_by_id(db, merchant_id)
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant not found")
    zones = await shipping_crud.get_by_merchant(db, merchant_id)
    if country:
        wanted = country.upper().strip()
        zones = [
            z for z in zones
            if any((c or "").upper().strip() == wanted for c in (z.countries or []))
        ]
    return [ShippingZoneRead.model_validate(z) for z in zones]


# ── Promotions (protected) ───────────────────────────────────────────────────

@router.post("/promotions/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    payload: CouponValidateRequest,
    db: AsyncSession = Depends(get_db),
    current_user_obj: User = Depends(require_customer),
) -> CouponValidateResponse:
    result = await db.execute(
        select(Promotion).where(
            Promotion.code == payload.code.upper().strip(),
            Promotion.is_active.is_(True),
        )
    )
    promo = result.scalars().first()

    if not promo:
        return CouponValidateResponse(valid=False, message="Mã giảm giá không tồn tại")

    # Check expiry — expires_at is timezone-aware datetime
    if promo.expires_at is not None:
        now_utc = datetime.now(UTC)
        # Ensure comparison is tz-aware
        expires = promo.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=UTC)
        if expires < now_utc:
            return CouponValidateResponse(valid=False, message="Mã giảm giá đã hết hạn")

    # Check max usage
    if promo.max_usage is not None and promo.usage_count >= promo.max_usage:
        return CouponValidateResponse(valid=False, message="Mã giảm giá đã hết lượt sử dụng")

    # Check min order
    if promo.min_order and payload.order_total < float(promo.min_order):
        return CouponValidateResponse(
            valid=False,
            message=f"Đơn hàng tối thiểu {float(promo.min_order):,.0f}₫ để áp dụng mã này",
        )

    # Calculate discount
    value = float(promo.value)
    if promo.type == PromotionType.percentage:
        discount_amount = round(payload.order_total * value / 100)
        message = f"Giảm {value:.0f}% đơn hàng"
    else:  # fixed
        discount_amount = min(value, payload.order_total)
        message = f"Giảm {value:,.0f}₫ đơn hàng"

    return CouponValidateResponse(
        valid=True,
        discount_pct=value if promo.type == PromotionType.percentage else 0.0,
        discount_amount=discount_amount,
        message=message,
        promotion_id=promo.id,
    )


# ── Cart (protected) ──────────────────────────────────────────────────────────

@router.get("/cart", response_model=list[CartItemRead])
async def get_cart(
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> list[CartItemRead]:
    items = await cart_crud.get_by_customer(db, user.id)
    return [CartItemRead.model_validate(i) for i in items]


@router.post("/cart", response_model=CartItemRead, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    body: AddToCart,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> CartItemRead:
    product = await product_crud.get_by_id(db, body.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product.status != ProductStatus.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sản phẩm này hiện không còn bán",
        )
    if product.stock < body.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sản phẩm chỉ còn {product.stock} đơn vị trong kho",
        )
    item = await cart_crud.add_item(db, user.id, body.product_id, body.quantity)
    return CartItemRead.model_validate(item)


@router.patch("/cart/{product_id}", response_model=CartItemRead)
async def update_cart_item(
    product_id: int,
    body: UpdateCartItem,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> CartItemRead:
    item = await cart_crud.get_item(db, user.id, product_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    try:
        item = await cart_crud.update_item(db, item, body.quantity)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return CartItemRead.model_validate(item)


@router.delete("/cart/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_cart(
    product_id: int,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> None:
    item = await cart_crud.get_item(db, user.id, product_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    await cart_crud.remove_item(db, item)


@router.delete("/cart", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> None:
    await cart_crud.clear_cart(db, user.id)


# ── Orders (protected) ────────────────────────────────────────────────────────

@router.post("/orders", response_model=OrderDetail, status_code=status.HTTP_201_CREATED)
async def checkout(
    body: CreateOrder,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> OrderDetail:
    try:
        order = await order_crud.create(db, user.id, body)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return OrderDetail.model_validate(order)


@router.get("/orders", response_model=list[OrderRead])
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> list[OrderRead]:
    orders = await order_crud.get_by_customer(db, user.id, skip=skip, limit=limit)
    return [OrderRead.model_validate(o) for o in orders]


@router.get("/orders/{order_id}", response_model=OrderDetail)
async def get_order(
    order_id: int,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> OrderDetail:
    order = await order_crud.get_by_id(db, order_id)
    if not order or order.customer_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return OrderDetail.model_validate(order)


@router.post("/orders/{order_id}/cancel", response_model=OrderRead)
async def cancel_order(
    order_id: int,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> OrderRead:
    from app.schemas.order import UpdateOrderStatus

    order_result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .with_for_update()
        .options(selectinload(Order.items))
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy đơn hàng")
    if order.customer_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền hủy đơn hàng này"
        )
    if order.status == OrderStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Đơn hàng đã được hủy trước đó"
        )
    if order.status not in (OrderStatus.pending, OrderStatus.processing):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Chỉ có thể hủy đơn hàng đang chờ xử lý hoặc đang xử lý",
        )
    try:
        updated = await order_crud.update_status(
            db, order, UpdateOrderStatus(status=OrderStatus.cancelled)
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    return OrderRead.model_validate(updated)


# ── Reviews (public GET, protected POST) ─────────────────────────────────────

@router.get("/products/{product_id}/reviews", response_model=list[ReviewRead])
async def list_reviews(
    product_id: int,
    sort_by: str = Query(default="newest", max_length=50),
    db: AsyncSession = Depends(get_db),
) -> list[ReviewRead]:
    from sqlalchemy import asc, desc
    q = select(Review).where(Review.product_id == product_id)
    if sort_by == "rating_desc":
        q = q.order_by(desc(Review.rating))
    elif sort_by == "rating_asc":
        q = q.order_by(asc(Review.rating))
    else:  # newest
        q = q.order_by(desc(Review.created_at))
    q = q.limit(50)
    result = await db.execute(q)
    return [ReviewRead.model_validate(r) for r in result.scalars().all()]


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_review(
    product_id: int,
    body: ReviewCreate,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> ReviewRead:
    # Gate: customer must have a delivered order containing this product
    has_purchase = await db.scalar(
        select(exists().where(
            Order.customer_id == user.id,
            Order.status == OrderStatus.delivered,
            Order.id == OrderItem.order_id,
            OrderItem.product_id == product_id,
        ))
    )
    if not has_purchase:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chỉ có thể đánh giá sản phẩm đã mua và đã nhận hàng",
        )
    try:
        review = await review_crud.create(db, user.id, product_id, body)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return ReviewRead.model_validate(review)


@router.patch("/products/{product_id}/reviews/{review_id}", response_model=ReviewRead)
async def update_review(
    product_id: int,
    review_id: int,
    body: ReviewCreate,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> ReviewRead:
    review_result = await db.execute(
        select(Review).where(Review.id == review_id).with_for_update()
    )
    review = review_result.scalar_one_or_none()
    if not review or review.product_id != product_id:
        raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
    if review.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa đánh giá này")
    updated = await review_crud.update(db, review, body.rating, body.comment)
    return ReviewRead.model_validate(updated)


@router.delete("/products/{product_id}/reviews/{review_id}", status_code=204)
async def delete_review(
    product_id: int,
    review_id: int,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> None:
    review_result = await db.execute(
        select(Review).where(Review.id == review_id).with_for_update()
    )
    review = review_result.scalar_one_or_none()
    if not review or review.product_id != product_id:
        raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
    if review.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Không có quyền xóa đánh giá này")
    await review_crud.delete(db, review)


# ── Account (protected) ───────────────────────────────────────────────────────

@router.get("/account", response_model=UserRead)
async def get_account(user: User = Depends(current_user)) -> UserRead:
    return UserRead.model_validate(user)


@router.patch("/account", response_model=UserRead)
async def update_account(
    body: UserUpdate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(user, field, value)
    if updates:
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email đã được sử dụng bởi tài khoản khác",
            ) from None
        await db.refresh(user)
    return UserRead.model_validate(user)


# ── Profile (protected) ───────────────────────────────────────────────────────

@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user_obj: User = Depends(require_customer),
) -> UserProfile:
    return UserProfile(
        id=current_user_obj.id,
        full_name=current_user_obj.full_name,
        email=current_user_obj.email,
        phone=current_user_obj.phone,
    )


@router.patch("/profile", response_model=UserProfile)
async def update_profile(
    payload: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_obj: User = Depends(require_customer),
) -> UserProfile:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(current_user_obj, field, value)
    if updates:
        await db.commit()
        await db.refresh(current_user_obj)
    return UserProfile(
        id=current_user_obj.id,
        full_name=current_user_obj.full_name,
        email=current_user_obj.email,
        phone=current_user_obj.phone,
    )


# ── Order Events (protected) ──────────────────────────────────────────────────

@router.get("/orders/{order_id}/events", response_model=list[OrderEventRead])
async def get_order_events(
    order_id: int,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> list[OrderEventRead]:
    order = await order_crud.get_by_id(db, order_id)
    if not order or order.customer_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    events = await event_crud.get_by_order(db, order_id)
    return [OrderEventRead.model_validate(e) for e in events]


# ── Address Book (protected) ──────────────────────────────────────────────────

@router.get("/addresses", response_model=list[AddressRead])
async def list_addresses(
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> list[AddressRead]:
    addresses = await address_crud.get_by_user(db, user.id)
    return [AddressRead.model_validate(a) for a in addresses]


@router.post("/addresses", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
async def create_address(
    body: AddressCreate,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> AddressRead:
    addr = await address_crud.create(db, user.id, body)
    return AddressRead.model_validate(addr)


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: int,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> None:
    addr_del_result = await db.execute(
        select(UserAddress).where(UserAddress.id == address_id).with_for_update()
    )
    addr = addr_del_result.scalar_one_or_none()
    if not addr or addr.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    await address_crud.delete(db, addr)


@router.patch("/addresses/{address_id}/default", response_model=AddressRead)
async def set_default_address(
    address_id: int,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> AddressRead:
    addr_result = await db.execute(
        select(UserAddress).where(UserAddress.id == address_id).with_for_update()
    )
    addr = addr_result.scalar_one_or_none()
    if not addr or addr.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    addr = await address_crud.set_default(db, user.id, addr)
    return AddressRead.model_validate(addr)


# ── Wishlist (protected) ──────────────────────────────────────────────────────

@router.get("/wishlist", response_model=list[WishlistItemRead])
async def get_wishlist(
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> list[WishlistItemRead]:
    items = await wishlist_crud.get_by_user(db, user.id)
    return [WishlistItemRead.model_validate(i) for i in items]


@router.post(
    "/wishlist/{product_id}",
    response_model=WishlistItemRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_to_wishlist(
    product_id: int,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> WishlistItemRead:
    existing = await wishlist_crud.get_item(db, user.id, product_id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already in wishlist")
    product = await product_crud.get_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    item = await wishlist_crud.add(db, user.id, product_id)
    return WishlistItemRead.model_validate(item)


@router.delete("/wishlist/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_wishlist(
    product_id: int,
    user: User = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
) -> None:
    item_result = await db.execute(
        select(WishlistItem)
        .where(WishlistItem.user_id == user.id, WishlistItem.product_id == product_id)
        .with_for_update()
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not in wishlist")
    await wishlist_crud.remove(db, item)


# ── Return requests ───────────────────────────────────────────────────────────

class ReturnRequestCreate(BaseModel):
    reason: str = Field(min_length=1)


class ReturnRequestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_id: int
    customer_id: int
    reason: str
    status: str
    seller_note: str | None
    created_at: datetime


@router.post(
    "/orders/{order_id}/return",
    response_model=ReturnRequestRead,
    status_code=status.HTTP_201_CREATED,
)
async def request_return(
    order_id: int,
    body: ReturnRequestCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_customer),
) -> ReturnRequestRead:
    from app.crud import return_request as return_crud

    order_result = await db.execute(
        select(Order).where(Order.id == order_id).with_for_update()
    )
    order = order_result.scalar_one_or_none()
    if not order or order.customer_id != user.id:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.delivered:
        raise HTTPException(
            status_code=400, detail="Chỉ có thể yêu cầu đổi trả với đơn đã giao"
        )
    existing = await return_crud.get_by_order(db, order_id)
    if existing:
        raise HTTPException(
            status_code=409, detail="Đơn hàng này đã có yêu cầu đổi trả"
        )
    return_obj = await return_crud.create(
        db, order_id=order_id, customer_id=user.id, reason=body.reason
    )
    return ReturnRequestRead.model_validate(return_obj)


@router.get("/returns", response_model=list[ReturnRequestRead])
async def my_returns(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_customer),
) -> list:
    from app.crud import return_request as return_crud
    return await return_crud.get_for_customer(db, user.id)
