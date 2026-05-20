"""Email notification service using aiosmtplib."""
# ruff: noqa: E501
from __future__ import annotations

import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

try:
    import aiosmtplib
    SMTP_AVAILABLE = True
except ImportError:
    SMTP_AVAILABLE = False


SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@dhtc.vn")
FROM_NAME = os.getenv("FROM_NAME", "DHTC Marketplace")


async def send_email(to: str, subject: str, html: str) -> bool:
    """Send HTML email. Returns True on success, False on failure."""
    if not SMTP_AVAILABLE or not SMTP_USER or not SMTP_PASS:
        print(f"[Email] SMTP not configured — skipping email to {to}: {subject}")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to
        msg.attach(MIMEText(html, "html", "utf-8"))
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASS,
            start_tls=True,
        )
        print(f"[Email] Sent '{subject}' to {to}")
        return True
    except Exception as e:
        print(f"[Email] Failed to send to {to}: {e}")
        return False


def _base_template(content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8">
<style>
body{{font-family:Arial,sans-serif;background:#f5f5f0;margin:0;padding:20px}}
.card{{background:#fff;border-radius:12px;padding:32px;max-width:560px;margin:0 auto;border:1px solid #e5e5e5}}
.header{{color:#1a6b3c;font-size:22px;font-weight:700;margin-bottom:16px}}
.badge{{display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600}}
.btn{{display:inline-block;padding:12px 24px;background:#1a6b3c;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px}}
.footer{{color:#999;font-size:12px;margin-top:24px;text-align:center}}
</style></head>
<body><div class="card">{content}<div class="footer">© 2026 DHTC Marketplace — Đặc sản Việt Nam</div></div></body></html>"""


async def send_order_confirmation(to: str, order_id: int, total: float) -> bool:
    html = _base_template(f"""
<div class="header">Đặt hàng thành công!</div>
<p>Cảm ơn bạn đã đặt hàng tại <strong>DHTC Marketplace</strong>.</p>
<p>Mã đơn hàng: <strong>#{order_id}</strong></p>
<p>Tổng tiền: <strong>{total:,.0f} VND</strong></p>
<p>Người bán đang chuẩn bị đơn hàng của bạn. Bạn sẽ nhận được thông báo khi đơn hàng được xác nhận.</p>
<a href="http://localhost:5173/tracking?order={order_id}" class="btn">Theo dõi đơn hàng</a>
""")
    return await send_email(to, f"[DHTC] Đặt hàng thành công – Đơn #{order_id}", html)


async def send_order_shipped(to: str, order_id: int, tracking_number: str | None) -> bool:
    tracking = f"<p>Mã vận đơn: <strong>{tracking_number}</strong></p>" if tracking_number else ""
    html = _base_template(f"""
<div class="header">Đơn hàng đang được giao!</div>
<p>Đơn hàng <strong>#{order_id}</strong> đã được giao cho đơn vị vận chuyển.</p>
{tracking}
<p>Dự kiến giao hàng trong 2-5 ngày làm việc.</p>
<a href="http://localhost:5173/tracking?order={order_id}" class="btn">Theo dõi đơn hàng</a>
""")
    return await send_email(to, f"[DHTC] Đơn hàng #{order_id} đang được giao", html)


async def send_order_delivered(to: str, order_id: int) -> bool:
    html = _base_template(f"""
<div class="header">Đơn hàng đã giao thành công!</div>
<p>Đơn hàng <strong>#{order_id}</strong> đã được giao đến bạn.</p>
<p>Cảm ơn bạn đã mua sắm tại <strong>DHTC Marketplace</strong>! Hãy để lại đánh giá để giúp những khách hàng khác nhé.</p>
<a href="http://localhost:5173/tracking?order={order_id}" class="btn">Đánh giá đơn hàng</a>
""")
    return await send_email(to, f"[DHTC] Đơn hàng #{order_id} đã giao thành công", html)


async def send_order_cancelled(to: str, order_id: int) -> bool:
    html = _base_template(f"""
<div class="header">Đơn hàng đã bị hủy</div>
<p>Đơn hàng <strong>#{order_id}</strong> của bạn đã được hủy thành công.</p>
<p>Nếu bạn đã thanh toán, tiền sẽ được hoàn trả trong 3-5 ngày làm việc.</p>
<a href="http://localhost:5173/shop" class="btn">Tiếp tục mua sắm</a>
""")
    return await send_email(to, f"[DHTC] Đơn hàng #{order_id} đã bị hủy", html)
