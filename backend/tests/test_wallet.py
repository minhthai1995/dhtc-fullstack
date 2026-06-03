"""Integration tests for seller wallet summary + withdrawal bank persistence."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.crud import wallet as wallet_crud
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.user import UserRole
from app.models.wallet import TransactionType


async def _create_seller_with_balance(
    client: AsyncClient,
    db_session: AsyncSession,
    email: str,
    *,
    sale_amount: float = 2_000_000,
) -> tuple[str, Merchant]:
    """Create a seller user + merchant + a sale to seed positive balance."""
    await user_crud.create_user(db_session, email, "pass1234", role=UserRole.seller)
    seller = await user_crud.get_by_email(db_session, email)
    assert seller is not None

    slug_suffix = email.split("@")[0]
    merchant = Merchant(
        user_id=seller.id,
        shop_name="Wallet Test Shop",
        slug=f"shop-{slug_suffix}",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
        region="HN",
    )
    db_session.add(merchant)
    await db_session.commit()
    await db_session.refresh(merchant)

    await wallet_crud.add_transaction(
        db_session,
        merchant.id,
        TransactionType.sale,
        sale_amount,
        description="seed sale",
    )

    login = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "pass1234"}
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"], merchant


@pytest.mark.asyncio
async def test_wallet_summary_empty_last_bank(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, _ = await _create_seller_with_balance(
        client, db_session, "wallet1@test.com"
    )

    resp = await client.get(
        "/api/v1/seller/wallet", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["last_bank_name"] is None
    assert data["last_bank_account"] is None
    assert data["balance"] == pytest.approx(2_000_000)


@pytest.mark.asyncio
async def test_wallet_summary_surfaces_last_withdrawal_bank(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, _ = await _create_seller_with_balance(
        client, db_session, "wallet2@test.com"
    )

    withdraw = await client.post(
        "/api/v1/seller/wallet/withdraw",
        json={
            "amount": 500_000,
            "bank_name": "Vietcombank",
            "bank_account": "9988776655",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert withdraw.status_code == 201, withdraw.text

    resp = await client.get(
        "/api/v1/seller/wallet", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["last_bank_name"] == "Vietcombank"
    assert data["last_bank_account"] == "9988776655"
    assert data["balance"] == pytest.approx(1_500_000)


@pytest.mark.asyncio
async def test_wallet_summary_returns_most_recent_bank(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, _ = await _create_seller_with_balance(
        client, db_session, "wallet3@test.com"
    )

    for bank, account, amount in [
        ("Vietcombank", "1111", 500_000),
        ("Techcombank", "2222", 600_000),
    ]:
        r = await client.post(
            "/api/v1/seller/wallet/withdraw",
            json={"amount": amount, "bank_name": bank, "bank_account": account},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 201, r.text

    resp = await client.get(
        "/api/v1/seller/wallet", headers={"Authorization": f"Bearer {token}"}
    )
    data = resp.json()
    assert data["last_bank_name"] == "Techcombank"
    assert data["last_bank_account"] == "2222"


@pytest.mark.asyncio
async def test_wallet_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/seller/wallet")
    assert resp.status_code == 401
