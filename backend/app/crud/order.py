from __future__ import annotations

import contextlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud import promotion as promotion_crud
from app.crud import shipping as shipping_crud
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product, ProductStatus
from app.schemas.order import CreateOrder, UpdateOrderStatus


async def get_by_id(db: AsyncSession, order_id: int) -> Order | None:
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return result.scalars().first()


async def get_by_customer(
    db: AsyncSession,
    customer_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.customer_id == customer_id)
        .offset(skip)
        .limit(limit)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return list(result.scalars().all())


async def get_by_merchant(
    db: AsyncSession,
    merchant_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(Order.merchant_id == merchant_id)
        .offset(skip)
        .limit(limit)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return list(result.scalars().all())


async def get_all(db: AsyncSession, skip: int = 0, limit: int = 50) -> list[Order]:
    result = await db.execute(
        select(Order)
        .offset(skip)
        .limit(limit)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    return list(result.scalars().all())


async def create(db: AsyncSession, customer_id: int, data: CreateOrder) -> Order:
    if not data.items:
        raise ValueError("Đơn hàng phải có ít nhất một sản phẩm")

    total = 0.0
    item_rows: list[tuple[int, int, float]] = []
    inferred_merchant_id: int | None = data.merchant_id

    async with db.begin_nested():
        for item in data.items:
            result = await db.execute(
                select(Product).where(Product.id == item.product_id).with_for_update()
            )
            product = result.scalars().first()
            if product is None:
                raise ValueError(f"Sản phẩm {item.product_id} không tồn tại")

            if product.status != ProductStatus.active:
                raise ValueError(f"Sản phẩm '{product.name_vi}' hiện không còn bán")

            if product.stock < item.quantity:
                raise ValueError(
                    f"Sản phẩm '{product.name_vi}' chỉ còn {product.stock} đơn vị trong kho"
                )

            if inferred_merchant_id is None:
                inferred_merchant_id = product.merchant_id
            elif inferred_merchant_id != product.merchant_id:
                raise ValueError("All items must be from the same merchant")
            unit_price = float(product.price)
            total += unit_price * item.quantity
            item_rows.append((item.product_id, item.quantity, unit_price))
            product.stock -= item.quantity
            product.sold_count += item.quantity

        if inferred_merchant_id is None:
            raise ValueError("Đơn hàng phải có ít nhất một sản phẩm")

        shipping_fee = float(data.shipping_fee or 0)
        shipping_method_resolved = data.shipping_method
        if data.shipping_zone_id is not None:
            zone = await shipping_crud.get_by_id(db, data.shipping_zone_id)
            if zone is None or zone.merchant_id != inferred_merchant_id:
                raise ValueError("Phương thức vận chuyển không hợp lệ")
            shipping_fee = float(zone.base_rate)
            shipping_method_resolved = f"zone:{zone.zone_name}"

        applied_promo = None
        discount = 0.0
        if data.promotion_code:
            applied_promo = await promotion_crud.apply_to_subtotal(
                db, data.promotion_code, inferred_merchant_id, total
            )
            discount = applied_promo.discount

        order_total = max(0.0, total - discount) + shipping_fee
        order = Order(
            customer_id=customer_id,
            merchant_id=inferred_merchant_id,
            total_amount=order_total,
            shipping_address=data.shipping_address.model_dump(),
            notes=data.notes,
            payment_method=data.payment_method,
            shipping_method=shipping_method_resolved,
            shipping_fee=shipping_fee,
        )
        db.add(order)
        await db.flush()

        for product_id, quantity, unit_price in item_rows:
            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product_id,
                    quantity=quantity,
                    unit_price=unit_price,
                )
            )

    if applied_promo is not None:
        await promotion_crud.increment_usage(db, applied_promo.promotion.id)

    # Emit initial pending event in the same commit as the order
    from app.models.order_event import OrderEvent as _OrderEvent
    db.add(_OrderEvent(order_id=order.id, status=order.status, note="Đơn hàng được tạo"))
    await db.commit()

    # Re-fetch with full eager-loading so item.product is available synchronously
    refreshed = await get_by_id(db, order.id)
    assert refreshed is not None

    # Fire-and-forget confirmation email
    import asyncio

    from app.models.user import User as _User
    from app.services.email import send_order_confirmation
    customer = await db.get(_User, customer_id)
    if customer and customer.email:
        with contextlib.suppress(Exception):
            asyncio.create_task(
                send_order_confirmation(customer.email, refreshed.id, float(refreshed.total_amount))
            )

    return refreshed


async def update_status_by_id(
    db: AsyncSession,
    order_id: int,
    new_status: OrderStatus,
    note: str | None = None,
    tracking_number: str | None = None,
) -> Order | None:
    """Update order status by ID; used by admin and seller routes."""
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .with_for_update()
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    )
    order = result.scalars().first()
    if order is None:
        return None
    data = UpdateOrderStatus(status=new_status, tracking_number=tracking_number)
    updated = await update_status(db, order, data, note=note)
    return updated


async def _notify(
    db: AsyncSession,
    user_id: int | None,
    type_: str,
    title: str,
    message: str,
    link: str | None = None,
    ref_id: int | None = None,
) -> int | None:
    """Fire-and-forget notification helper — never breaks the main flow."""
    if user_id is None:
        return None
    try:
        from app.crud.notification import create as create_notif
        from app.models.notification import NotificationType
        await create_notif(
            db, user_id, NotificationType(type_), title, message, link=link, reference_id=ref_id
        )
        return user_id
    except Exception:
        return None


async def update_status(
    db: AsyncSession, order: Order, data: UpdateOrderStatus, note: str | None = None
) -> Order:
    from app.crud import wallet as wallet_crud
    from app.models.wallet import TransactionType

    old_status = order.status

    # Restore stock when cancelling an order that is not already cancelled
    if data.status == OrderStatus.cancelled and old_status != OrderStatus.cancelled:
        items_result = await db.execute(
            select(OrderItem).where(OrderItem.order_id == order.id).with_for_update()
        )
        for order_item in items_result.scalars().all():
            prod_result = await db.execute(
                select(Product).where(Product.id == order_item.product_id).with_for_update()
            )
            product = prod_result.scalars().first()
            if product is not None:
                product.stock += order_item.quantity
                product.sold_count = max(0, product.sold_count - order_item.quantity)

    order.status = data.status
    if data.tracking_number is not None:
        order.tracking_number = data.tracking_number

    # Emit status-change event (staged before commit)
    from app.models.order_event import OrderEvent as _OrderEvent
    db.add(_OrderEvent(order_id=order.id, status=data.status, note=note))

    # Credit wallet atomically with the status change — commit=False flushes only
    if data.status == OrderStatus.delivered and old_status != OrderStatus.delivered:
        await wallet_crud.add_transaction(
            db,
            order.merchant_id,
            TransactionType.sale,
            float(order.total_amount),
            description=f"Order #{order.id} delivered",
            commit=False,
        )

    await db.commit()
    await db.refresh(order)

    # Notify customer (and seller on delivered/cancelled) based on new status
    notified: list[int] = []
    new_status = data.status
    if new_status == OrderStatus.processing and old_status != OrderStatus.processing:
        uid = await _notify(
            db, order.customer_id, "order_confirmed",
            f"Đơn hàng #{order.id} đang được xử lý",
            "Người bán đã xác nhận đơn hàng của bạn.",
            link=f"/tracking?order={order.id}", ref_id=order.id,
        )
        if uid is not None:
            notified.append(uid)
    elif new_status == OrderStatus.shipped and old_status != OrderStatus.shipped:
        tracking_info = f" AWB: {order.tracking_number}" if order.tracking_number else ""
        uid = await _notify(
            db, order.customer_id, "order_shipped",
            f"Đơn hàng #{order.id} đang được giao",
            f"Đơn hàng đã được giao cho đơn vị vận chuyển.{tracking_info}",
            link=f"/tracking?order={order.id}", ref_id=order.id,
        )
        if uid is not None:
            notified.append(uid)
    elif new_status == OrderStatus.delivered and old_status != OrderStatus.delivered:
        uid = await _notify(
            db, order.customer_id, "order_delivered",
            f"Đơn hàng #{order.id} đã giao thành công",
            "Cảm ơn bạn đã mua hàng tại DHTC! Hãy để lại đánh giá sản phẩm.",
            link=f"/tracking?order={order.id}", ref_id=order.id,
        )
        if uid is not None:
            notified.append(uid)
        # Notify seller
        from app.models.merchant import Merchant as _Merchant
        merchant_result = await db.execute(
            select(_Merchant).where(_Merchant.id == order.merchant_id)
        )
        merchant = merchant_result.scalars().first()
        if merchant:
            uid = await _notify(
                db, merchant.user_id, "order_delivered",
                f"Đơn hàng #{order.id} đã hoàn thành",
                "Khách hàng đã nhận được đơn hàng. Doanh thu đã được ghi nhận.",
                link="/seller/orders", ref_id=order.id,
            )
            if uid is not None:
                notified.append(uid)
    elif new_status == OrderStatus.cancelled and old_status != OrderStatus.cancelled:
        uid = await _notify(
            db, order.customer_id, "order_cancelled",
            f"Đơn hàng #{order.id} đã bị hủy",
            "Đơn hàng của bạn đã được hủy thành công.",
            link=f"/tracking?order={order.id}", ref_id=order.id,
        )
        if uid is not None:
            notified.append(uid)

    try:
        await db.commit()
    except Exception:
        await db.rollback()

    from app.core.websocket import manager as _ws_manager
    for uid in set(notified):
        with contextlib.suppress(Exception):
            await _ws_manager.send_to_user(uid, {"type": "refresh"})

    # Fire-and-forget email notifications
    from app.models.user import User as _User
    from app.services.email import (
        send_order_cancelled,
        send_order_confirmation,
        send_order_delivered,
        send_order_shipped,
    )
    customer = await db.get(_User, order.customer_id)
    if customer and customer.email:
        import asyncio
        email = customer.email
        oid = order.id
        if new_status == OrderStatus.processing and old_status != OrderStatus.processing:
            with contextlib.suppress(Exception):
                asyncio.create_task(send_order_confirmation(email, oid, float(order.total_amount)))
        elif new_status == OrderStatus.shipped and old_status != OrderStatus.shipped:
            with contextlib.suppress(Exception):
                asyncio.create_task(send_order_shipped(email, oid, order.tracking_number))
        elif new_status == OrderStatus.delivered and old_status != OrderStatus.delivered:
            with contextlib.suppress(Exception):
                asyncio.create_task(send_order_delivered(email, oid))
        elif new_status == OrderStatus.cancelled and old_status != OrderStatus.cancelled:
            with contextlib.suppress(Exception):
                asyncio.create_task(send_order_cancelled(email, oid))

    return order
