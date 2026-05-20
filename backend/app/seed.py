"""Seed script for DHTC Platform.

Run with: uv run python -m app.seed
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.core.db import get_db
from app.crud import user as user_crud
from app.models.category import Category
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product, ProductStatus
from app.models.promotion import Promotion, PromotionType
from app.models.user import User, UserRole

PRODUCT_IMAGES = [
    "https://dhtcdanang.com/wp-content/uploads/2023/07/34-300x300.png",
    "https://dhtcdanang.com/wp-content/uploads/2023/07/24-300x300.png",
    "https://dhtcdanang.com/wp-content/uploads/2023/07/2-300x300.png",
    "https://dhtcdanang.com/wp-content/uploads/2023/07/39-300x300.png",
    "https://dhtcdanang.com/wp-content/uploads/2023/07/38-300x300.png",
    "https://dhtcdanang.com/wp-content/uploads/2023/07/20-300x300.png",
    "https://dhtcdanang.com/wp-content/uploads/2023/07/30-300x300.png",
    "https://dhtcdanang.com/wp-content/uploads/2023/07/10-300x300.png",
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slug(text: str) -> str:
    return text.lower().replace(" ", "-")


# ---------------------------------------------------------------------------
# Seed definitions
# ---------------------------------------------------------------------------

CATEGORIES = [
    {"name_vi": "Cà phê & trà", "name_en": "Coffee & Tea", "slug": "ca-phe-tra", "sort_order": 1},
    {
        "name_vi": "Trái cây sấy",
        "name_en": "Dried Fruit",
        "slug": "trai-cay-say",
        "sort_order": 2,
    },
    {
        "name_vi": "Hạt & ngũ cốc",
        "name_en": "Nuts & Grains",
        "slug": "hat-ngu-coc",
        "sort_order": 3,
    },
    {
        "name_vi": "Gia vị & mắm",
        "name_en": "Spices & Condiments",
        "slug": "gia-vi-mam",
        "sort_order": 4,
    },
    {"name_vi": "Bánh & kẹo", "name_en": "Bakery & Candy", "slug": "banh-keo", "sort_order": 5},
]

SELLERS = [
    {
        "email": "seller@dhtc.vn",
        "password": "seller123",
        "merchant": {
            "shop_name": "HTX Cà Phê Hữu Cơ Đắk Lắk",
            "slug": "htx-ca-phe-dak-lak",
            "region": "Tây Nguyên",
            "tier": MerchantTier.gold,
            "status": MerchantStatus.active,
            "description_vi": "Hợp tác xã cà phê hữu cơ nổi tiếng tại Đắk Lắk",
        },
    },
    {
        "email": "seller2@dhtc.vn",
        "password": "seller123",
        "merchant": {
            "shop_name": "Hồ Tiêu Vàng Gia Lai",
            "slug": "ho-tieu-vang-gia-lai",
            "region": "Tây Nguyên",
            "tier": MerchantTier.gold,
            "status": MerchantStatus.active,
            "description_vi": "Chuyên cung cấp hồ tiêu đặc sản Gia Lai chất lượng cao",
        },
    },
    {
        "email": "seller3@dhtc.vn",
        "password": "seller123",
        "merchant": {
            "shop_name": "Xoài Cát Chu Đồng Tháp",
            "slug": "xoai-cat-chu-dong-thap",
            "region": "Đồng Bằng",
            "tier": MerchantTier.silver,
            "status": MerchantStatus.active,
            "description_vi": "Trái cây sấy và xoài tươi đặc sản Đồng Tháp",
        },
    },
    {
        "email": "seller4@dhtc.vn",
        "password": "seller123",
        "merchant": {
            "shop_name": "Hạt Điều Bình Phước",
            "slug": "hat-dieu-binh-phuoc",
            "region": "Đông Nam Bộ",
            "tier": MerchantTier.silver,
            "status": MerchantStatus.active,
            "description_vi": "Hạt điều và các loại hạt đặc sản Bình Phước",
        },
    },
    {
        "email": "seller5@dhtc.vn",
        "password": "seller123",
        "merchant": {
            "shop_name": "Mật Ong Tây Bắc",
            "slug": "mat-ong-tay-bac",
            "region": "Tây Bắc",
            "tier": MerchantTier.bronze,
            "status": MerchantStatus.active,
            "description_vi": "Mật ong thiên nhiên từ núi rừng Tây Bắc",
        },
    },
]

# Products keyed by merchant slug; category referenced by slug
PRODUCTS_BY_MERCHANT: dict[str, list[dict]] = {
    "htx-ca-phe-dak-lak": [
        {
            "name_vi": "Cà phê chồn nguyên hạt 500g",
            "slug": "ca-phe-chon-nguyen-hat-500g",
            "price": 680000,
            "stock": 48,
            "sold_count": 3128,
            "category_slug": "ca-phe-tra",
            "origin": "Đắk Lắk",
            "certifications": ["OCOP 4★", "USDA Organic"],
            "rating": 4.9,
        },
        {
            "name_vi": "Arabica rang xay 250g",
            "slug": "arabica-rang-xay-250g",
            "price": 185000,
            "stock": 120,
            "sold_count": 1842,
            "category_slug": "ca-phe-tra",
            "origin": "Đắk Lắk",
            "certifications": ["VietGAP"],
            "rating": 4.7,
        },
        {
            "name_vi": "Robusta nguyên hạt 1kg",
            "slug": "robusta-nguyen-hat-1kg",
            "price": 220000,
            "stock": 80,
            "sold_count": 986,
            "category_slug": "ca-phe-tra",
            "origin": "Đắk Lắk",
            "certifications": ["HACCP"],
            "rating": 4.5,
        },
        {
            "name_vi": "Cold brew concentrate 500ml",
            "slug": "cold-brew-concentrate-500ml",
            "price": 145000,
            "stock": 60,
            "sold_count": 547,
            "category_slug": "ca-phe-tra",
            "origin": "Đắk Lắk",
            "certifications": [],
            "rating": 4.6,
        },
    ],
    "ho-tieu-vang-gia-lai": [
        {
            "name_vi": "Hồ tiêu đen 200g",
            "slug": "ho-tieu-den-200g",
            "price": 95000,
            "stock": 200,
            "sold_count": 2200,
            "category_slug": "gia-vi-mam",
            "origin": "Gia Lai",
            "certifications": ["OCOP 4★"],
            "rating": 4.8,
        },
        {
            "name_vi": "Hồ tiêu đỏ 100g",
            "slug": "ho-tieu-do-100g",
            "price": 120000,
            "stock": 80,
            "sold_count": 890,
            "category_slug": "gia-vi-mam",
            "origin": "Gia Lai",
            "certifications": ["VietGAP"],
            "rating": 4.9,
        },
        {
            "name_vi": "Hồ tiêu trắng xay 150g",
            "slug": "ho-tieu-trang-xay-150g",
            "price": 110000,
            "stock": 150,
            "sold_count": 640,
            "category_slug": "gia-vi-mam",
            "origin": "Gia Lai",
            "certifications": ["VietGAP"],
            "rating": 4.7,
        },
        {
            "name_vi": "Ớt khô nguyên trái 200g",
            "slug": "ot-kho-nguyen-trai-200g",
            "price": 65000,
            "stock": 300,
            "sold_count": 1100,
            "category_slug": "gia-vi-mam",
            "origin": "Gia Lai",
            "certifications": [],
            "rating": 4.5,
        },
    ],
    "xoai-cat-chu-dong-thap": [
        {
            "name_vi": "Xoài sấy dẻo Cát Chu 300g",
            "slug": "xoai-say-deo-cat-chu-300g",
            "price": 120000,
            "stock": 200,
            "sold_count": 2240,
            "category_slug": "trai-cay-say",
            "origin": "Đồng Tháp",
            "certifications": ["OCOP 4★"],
            "rating": 4.8,
        },
        {
            "name_vi": "Xoài sấy giòn 200g",
            "slug": "xoai-say-gion-200g",
            "price": 89000,
            "stock": 150,
            "sold_count": 1350,
            "category_slug": "trai-cay-say",
            "origin": "Đồng Tháp",
            "certifications": ["VietGAP"],
            "rating": 4.6,
        },
        {
            "name_vi": "Dứa sấy không đường 200g",
            "slug": "dua-say-khong-duong-200g",
            "price": 75000,
            "stock": 180,
            "sold_count": 720,
            "category_slug": "trai-cay-say",
            "origin": "Tiền Giang",
            "certifications": [],
            "rating": 4.4,
        },
        {
            "name_vi": "Mít sấy giòn 250g",
            "slug": "mit-say-gion-250g",
            "price": 98000,
            "stock": 120,
            "sold_count": 880,
            "category_slug": "trai-cay-say",
            "origin": "Đồng Tháp",
            "certifications": ["OCOP 3★"],
            "rating": 4.7,
        },
    ],
    "hat-dieu-binh-phuoc": [
        {
            "name_vi": "Hạt điều rang muối 500g",
            "slug": "hat-dieu-rang-muoi-500g",
            "price": 210000,
            "stock": 88,
            "sold_count": 980,
            "category_slug": "hat-ngu-coc",
            "origin": "Bình Phước",
            "certifications": ["HACCP"],
            "rating": 4.6,
        },
        {
            "name_vi": "Hạt điều tách vỏ 300g",
            "slug": "hat-dieu-tach-vo-300g",
            "price": 175000,
            "stock": 120,
            "sold_count": 760,
            "category_slug": "hat-ngu-coc",
            "origin": "Bình Phước",
            "certifications": ["VietGAP"],
            "rating": 4.7,
        },
        {
            "name_vi": "Macadamia rang bơ 250g",
            "slug": "macadamia-rang-bo-250g",
            "price": 380000,
            "stock": 35,
            "sold_count": 310,
            "category_slug": "hat-ngu-coc",
            "origin": "Lâm Đồng",
            "certifications": ["VietGAP"],
            "rating": 4.8,
        },
        {
            "name_vi": "Hạt bí rang 300g",
            "slug": "hat-bi-rang-300g",
            "price": 85000,
            "stock": 200,
            "sold_count": 430,
            "category_slug": "hat-ngu-coc",
            "origin": "Đắk Nông",
            "certifications": [],
            "rating": 4.3,
        },
    ],
    "mat-ong-tay-bac": [
        {
            "name_vi": "Mật ong hoa cà phê 500ml",
            "slug": "mat-ong-hoa-ca-phe-500ml",
            "price": 250000,
            "stock": 60,
            "sold_count": 412,
            "category_slug": "gia-vi-mam",
            "origin": "Đắk Nông",
            "certifications": ["OCOP 4★"],
            "rating": 4.9,
        },
        {
            "name_vi": "Mật ong hoa rừng 500ml",
            "slug": "mat-ong-hoa-rung-500ml",
            "price": 280000,
            "stock": 45,
            "sold_count": 285,
            "category_slug": "gia-vi-mam",
            "origin": "Sơn La",
            "certifications": ["Organic"],
            "rating": 4.8,
        },
        {
            "name_vi": "Mật ong nhãn 300ml",
            "slug": "mat-ong-nhan-300ml",
            "price": 180000,
            "stock": 80,
            "sold_count": 520,
            "category_slug": "gia-vi-mam",
            "origin": "Hưng Yên",
            "certifications": ["VietGAP"],
            "rating": 4.7,
        },
        {
            "name_vi": "Bánh dừa nướng Bến Tre 200g",
            "slug": "banh-dua-nuong-ben-tre-200g",
            "price": 75000,
            "stock": 300,
            "sold_count": 1560,
            "category_slug": "banh-keo",
            "origin": "Bến Tre",
            "certifications": ["OCOP 3★"],
            "rating": 4.5,
        },
    ],
}

DEFAULT_SHIPPING_ADDRESS = {
    "name": "Khách Hàng",
    "phone": "0900000001",
    "address": "123 Đường Lê Duẩn",
    "city": "Đà Nẵng",
    "province": "Đà Nẵng",
    "zip": "550000",
}


# ---------------------------------------------------------------------------
# Main seed coroutine
# ---------------------------------------------------------------------------

async def seed() -> None:  # noqa: C901
    async for db in get_db():

        # ── Admin ──────────────────────────────────────────────────────────
        if not await user_crud.get_by_email(db, "admin@dhtc.vn"):
            await user_crud.create_user(
                db, "admin@dhtc.vn", "admin123", UserRole.admin, full_name="Quản trị viên DHTC"
            )
            print("Created admin@dhtc.vn")

        # ── Customer ───────────────────────────────────────────────────────
        customer = await user_crud.get_by_email(db, "customer@dhtc.vn")
        if not customer:
            customer = await user_crud.create_user(
                db, "customer@dhtc.vn", "customer123", UserRole.customer,
                full_name="Nguyễn Thu Hà", phone="0901234567",
            )
            print("Created customer@dhtc.vn")

        # ── Categories ─────────────────────────────────────────────────────
        category_map: dict[str, int] = {}
        for cat_data in CATEGORIES:
            existing = await db.execute(
                select(Category).where(Category.slug == cat_data["slug"])
            )
            cat = existing.scalars().first()
            if not cat:
                cat = Category(**cat_data)
                db.add(cat)
                await db.flush()
                print(f"Created category: {cat_data['name_vi']}")
            category_map[cat_data["slug"]] = cat.id

        await db.commit()

        # ── Sellers & Merchants ────────────────────────────────────────────
        merchant_map: dict[str, int] = {}  # slug → merchant.id
        for seller_def in SELLERS:
            user = await user_crud.get_by_email(db, seller_def["email"])
            if not user:
                user = await user_crud.create_user(
                    db,
                    seller_def["email"],
                    seller_def["password"],
                    UserRole.seller,
                )
                print(f"Created user: {seller_def['email']}")

            m_data = seller_def["merchant"]
            existing_m = await db.execute(
                select(Merchant).where(Merchant.slug == m_data["slug"])
            )
            merchant = existing_m.scalars().first()
            if not merchant:
                merchant = Merchant(
                    user_id=user.id,
                    shop_name=m_data["shop_name"],
                    slug=m_data["slug"],
                    region=m_data.get("region"),
                    tier=m_data["tier"],
                    status=m_data["status"],
                    description_vi=m_data.get("description_vi"),
                )
                db.add(merchant)
                await db.flush()
                print(f"Created merchant: {m_data['shop_name']}")

            merchant_map[m_data["slug"]] = merchant.id

        await db.commit()

        # ── Products ───────────────────────────────────────────────────────
        product_map: dict[str, int] = {}  # slug → product.id
        product_index = 0
        for merchant_slug, products in PRODUCTS_BY_MERCHANT.items():
            merchant_id = merchant_map[merchant_slug]
            for p_data in products:
                existing_p = await db.execute(
                    select(Product).where(Product.slug == p_data["slug"])
                )
                product = existing_p.scalars().first()
                if not product:
                    cat_id = category_map.get(p_data["category_slug"])
                    product = Product(
                        merchant_id=merchant_id,
                        category_id=cat_id,
                        name_vi=p_data["name_vi"],
                        slug=p_data["slug"],
                        price=p_data["price"],
                        stock=p_data["stock"],
                        sold_count=p_data["sold_count"],
                        rating=p_data.get("rating"),
                        status=ProductStatus.active,
                        origin=p_data.get("origin"),
                        certifications=p_data.get("certifications") or [],
                        images=[
                            {
                                "url": PRODUCT_IMAGES[product_index % len(PRODUCT_IMAGES)],
                                "is_primary": True,
                            }
                        ],
                    )
                    db.add(product)
                    await db.flush()
                    print(f"  Created product: {p_data['name_vi']}")
                product_map[p_data["slug"]] = product.id
                product_index += 1

        await db.commit()

        # Update existing products that have empty/null images
        products_result = await db.execute(select(Product))
        all_products = list(products_result.scalars().all())
        updated_count = 0
        for idx, prod in enumerate(all_products):
            if not prod.images:
                prod.images = [
                    {
                        "url": PRODUCT_IMAGES[idx % len(PRODUCT_IMAGES)],
                        "is_primary": True,
                    }
                ]
                updated_count += 1
        if updated_count:
            await db.commit()
            print(f"Updated {updated_count} products with images")

        # ── Sample Orders ──────────────────────────────────────────────────
        # Order 1: delivered, merchant1 (htx-ca-phe-dak-lak)
        # Items: cà phê chồn 1 unit + xoài sấy dẻo 2 units
        existing_orders = await db.execute(
            select(Order).where(Order.customer_id == customer.id)
        )
        if not existing_orders.scalars().first():
            merchant1_id = merchant_map["htx-ca-phe-dak-lak"]
            p_ca_phe_chon_id = product_map["ca-phe-chon-nguyen-hat-500g"]
            p_xoai_say_id = product_map["xoai-say-deo-cat-chu-300g"]
            p_hat_dieu_id = product_map["hat-dieu-rang-muoi-500g"]
            merchant4_id = merchant_map["hat-dieu-binh-phuoc"]

            # Order 1 — delivered
            order1 = Order(
                customer_id=customer.id,
                merchant_id=merchant1_id,
                status=OrderStatus.delivered,
                total_amount=680000 * 1 + 120000 * 2,
                shipping_address=DEFAULT_SHIPPING_ADDRESS,
            )
            db.add(order1)
            await db.flush()
            db.add(
                OrderItem(
                    order_id=order1.id,
                    product_id=p_ca_phe_chon_id,
                    quantity=1,
                    unit_price=680000,
                )
            )
            db.add(
                OrderItem(
                    order_id=order1.id,
                    product_id=p_xoai_say_id,
                    quantity=2,
                    unit_price=120000,
                )
            )
            print("Created order 1 (delivered)")

            # Order 2 — processing
            order2 = Order(
                customer_id=customer.id,
                merchant_id=merchant4_id,
                status=OrderStatus.processing,
                total_amount=210000 * 1,
                shipping_address=DEFAULT_SHIPPING_ADDRESS,
            )
            db.add(order2)
            await db.flush()
            db.add(
                OrderItem(
                    order_id=order2.id,
                    product_id=p_hat_dieu_id,
                    quantity=1,
                    unit_price=210000,
                )
            )
            print("Created order 2 (processing)")

            await db.commit()

        # ── Promotions ─────────────────────────────────────────────────────
        existing_fresh15 = await db.execute(
            select(Promotion).where(Promotion.code == "FRESH15")
        )
        if not existing_fresh15.scalars().first():
            merchant1_id = merchant_map["htx-ca-phe-dak-lak"]
            promo = Promotion(
                merchant_id=merchant1_id,
                code="FRESH15",
                type=PromotionType.percentage,
                value=15.0,
                min_order=0,
                is_active=True,
            )
            db.add(promo)
            await db.commit()
            print("Created promotion: FRESH15 (15% off, no minimum)")

        # ── Summary ────────────────────────────────────────────────────────
        cat_count = (await db.execute(select(Category))).scalars().all()
        merch_count = (await db.execute(select(Merchant))).scalars().all()
        prod_count = (await db.execute(select(Product))).scalars().all()
        order_count = (await db.execute(select(Order))).scalars().all()
        user_count = (await db.execute(select(User))).scalars().all()

        print("\n=== Seed Summary ===")
        print(f"  Users:      {len(user_count)}")
        print(f"  Categories: {len(cat_count)}")
        print(f"  Merchants:  {len(merch_count)}")
        print(f"  Products:   {len(prod_count)}")
        print(f"  Orders:     {len(order_count)}")
        print("====================\n")
        print("Seed complete.")
        break


if __name__ == "__main__":
    asyncio.run(seed())
