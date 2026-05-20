"""Custom tools for DHTC chatbot."""
from __future__ import annotations

import httpx

BACKEND_BASE = "http://localhost:8000/api/v1"


class DHTCTools:
    def get_tools(self) -> list:
        return [
            self.search_products,
            self.get_order_info,
            self.get_categories,
            self.get_promotions,
            self.get_return_policy,
        ]

    async def search_products(self, query: str) -> str:
        """
        Tìm kiếm sản phẩm đặc sản trong DHTC Marketplace.
        Args:
            query: Từ khóa tìm kiếm (ví dụ: cà phê, hồ tiêu, xoài sấy)
        """
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                resp = await client.get(
                    f"{BACKEND_BASE}/customer/products",
                    params={"search": query, "limit": 5, "sort_by": "best_seller"},
                )
                products = resp.json()
                if not isinstance(products, list) or not products:
                    return f"Không tìm thấy sản phẩm nào cho '{query}'. Thử từ khóa khác nhé!"
                lines = [f"Tìm thấy {len(products)} sản phẩm cho '{query}':"]
                for p in products:
                    price = (
                        f"{p['price']:,.0f}₫"
                        if isinstance(p.get("price"), (int, float))
                        else "—"
                    )
                    stock_note = "Còn hàng" if p.get("stock", 0) > 0 else "Hết hàng"
                    rating = f"⭐{p['rating']:.1f}" if p.get("rating") else ""
                    lines.append(f"• {p['name_vi']} — {price} {rating} ({stock_note})")
                lines.append("\nXem thêm tại: dhtc.vn/shop")
                return "\n".join(lines)
        except Exception as exc:
            return f"Không thể tìm kiếm lúc này ({exc}). Vui lòng thử lại sau."

    async def get_order_info(self, order_id: str) -> str:
        """
        Cung cấp hướng dẫn tra cứu đơn hàng cho khách.
        Args:
            order_id: Mã số đơn hàng (chỉ số, ví dụ: 123)
        """
        clean_id = order_id.replace("#", "").strip()
        return (
            f"Để tra cứu đơn hàng #{clean_id}:\n"
            f"1. Đăng nhập tại dhtc.vn/login\n"
            f"2. Vào mục 'Theo dõi đơn hàng'\n"
            f"3. Tìm đơn #{clean_id}\n\n"
            f"Hoặc liên hệ hỗ trợ qua Messenger này, cung cấp email đặt hàng "
            f"để nhân viên kiểm tra ngay cho bạn."
        )

    async def get_categories(self) -> str:
        """Lấy danh sách danh mục sản phẩm đặc sản DHTC."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{BACKEND_BASE}/customer/categories")
                cats = resp.json()
                if not isinstance(cats, list):
                    raise ValueError("unexpected response")
                lines = ["Danh mục sản phẩm tại DHTC Marketplace:"]
                for c in cats[:10]:
                    count = c.get("product_count", "")
                    count_str = f" ({count} sản phẩm)" if count else ""
                    lines.append(f"• {c['name_vi']}{count_str}")
                return "\n".join(lines)
        except Exception:
            return (
                "Danh mục đặc sản DHTC: Cà phê, Hồ tiêu, Trái cây sấy, "
                "Hạt điều, Mật ong, Gia vị, OCOP Đà Nẵng"
            )

    async def get_promotions(self) -> str:
        """Lấy danh sách khuyến mãi / mã giảm giá đang áp dụng tại DHTC."""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{BACKEND_BASE}/customer/promotions")
                promos = resp.json()
                if not isinstance(promos, list) or not promos:
                    return (
                        "Hiện tại chưa có khuyến mãi đặc biệt. "
                        "Theo dõi Fanpage để cập nhật sớm nhất nhé!"
                    )
                lines = ["🎁 Khuyến mãi đang có tại DHTC:"]
                for p in promos[:5]:
                    if p.get("discount_pct"):
                        val = f"Giảm {p['discount_pct']}%"
                    elif p.get("discount_amount"):
                        val = f"Giảm {p['discount_amount']:,.0f}₫"
                    else:
                        val = "Ưu đãi đặc biệt"
                    lines.append(f"• {p.get('code','—')}: {p.get('description', val)}")
                return "\n".join(lines)
        except Exception:
            return "Hiện tại DHTC có nhiều ưu đãi hấp dẫn. Ghé dhtc.vn/shop để xem chi tiết nhé!"

    async def get_return_policy(self) -> str:
        """Cung cấp thông tin chính sách đổi trả hàng của DHTC."""
        return (
            "Chính sách đổi trả DHTC Marketplace:\n"
            "✅ Thời gian: 7 ngày kể từ khi nhận hàng\n"
            "✅ Điều kiện: Sản phẩm còn nguyên vẹn, có hóa đơn\n"
            "✅ Lý do: Sản phẩm lỗi, hư hỏng khi vận chuyển, không đúng mô tả\n"
            "❌ Không áp dụng: Sản phẩm đã qua sử dụng, không có bao bì gốc\n\n"
            "📞 Cách yêu cầu đổi trả:\n"
            "1. Nhắn tin qua Fanpage này\n"
            "2. Hoặc email: support@dhtc.vn\n"
            "3. Hoàn tiền trong 3-5 ngày làm việc"
        )
