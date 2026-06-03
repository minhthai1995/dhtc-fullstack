from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cart import CartItem
from app.models.product import Product


async def get_by_customer(db: AsyncSession, customer_id: int) -> list[CartItem]:
    result = await db.execute(
        select(CartItem)
        .where(CartItem.customer_id == customer_id)
        .options(selectinload(CartItem.product))
    )
    return list(result.scalars().all())


async def get_item(
    db: AsyncSession, customer_id: int, product_id: int
) -> CartItem | None:
    result = await db.execute(
        select(CartItem)
        .where(
            CartItem.customer_id == customer_id,
            CartItem.product_id == product_id,
        )
        .options(selectinload(CartItem.product))
    )
    return result.scalars().first()


async def add_item(
    db: AsyncSession, customer_id: int, product_id: int, quantity: int = 1
) -> CartItem:
    existing_result = await db.execute(
        select(CartItem)
        .where(
            CartItem.customer_id == customer_id,
            CartItem.product_id == product_id,
        )
        .with_for_update()
    )
    existing = existing_result.scalars().first()
    if existing:
        new_qty = existing.quantity + quantity
        product_result = await db.execute(
            select(Product).where(Product.id == product_id).with_for_update()
        )
        product = product_result.scalar_one_or_none()
        if product and new_qty > product.stock:
            raise ValueError(f"Sản phẩm chỉ còn {product.stock} đơn vị trong kho")
        existing.quantity = new_qty
        await db.commit()
        # Re-fetch with product eager-loaded
        return await get_item(db, customer_id, product_id)  # type: ignore[return-value]
    item = CartItem(customer_id=customer_id, product_id=product_id, quantity=quantity)
    db.add(item)
    await db.commit()
    # Re-fetch with product eager-loaded
    fetched = await get_item(db, customer_id, product_id)
    assert fetched is not None
    return fetched


async def update_item(db: AsyncSession, item: CartItem, quantity: int) -> CartItem:
    if quantity <= 0:
        raise ValueError("Số lượng phải lớn hơn 0")
    product_result = await db.execute(
        select(Product).where(Product.id == item.product_id).with_for_update()
    )
    product = product_result.scalar_one_or_none()
    if product and quantity > product.stock:
        raise ValueError(f"Chỉ còn {product.stock} sản phẩm trong kho")
    item.quantity = quantity
    await db.commit()
    await db.refresh(item)
    return item


async def remove_item(db: AsyncSession, item: CartItem) -> None:
    await db.delete(item)
    await db.commit()


async def clear_cart(db: AsyncSession, customer_id: int) -> None:
    items = await get_by_customer(db, customer_id)
    for item in items:
        await db.delete(item)
    await db.commit()
