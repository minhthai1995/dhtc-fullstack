"""Integration tests for PUT /seller/profile covering the HTX business fields
added by migration f6dafa9f0006 (tax_id, address, phone, email, representative,
cccd, member_count, entity_type, certifications, plus bilingual business names
and social handles)."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import user as user_crud
from app.models.merchant import Merchant, MerchantStatus, MerchantTier
from app.models.user import UserRole


async def _seller_token(
    client: AsyncClient, db_session: AsyncSession, email: str
) -> str:
    await user_crud.create_user(db_session, email, "sellerpass", role=UserRole.seller)
    seller = await user_crud.get_by_email(db_session, email)
    assert seller is not None
    merchant = Merchant(
        user_id=seller.id,
        shop_name="HTX Test",
        slug=f"htx-{email[:6]}",
        status=MerchantStatus.active,
        tier=MerchantTier.bronze,
    )
    db_session.add(merchant)
    await db_session.commit()
    login = await client.post(
        "/api/v1/auth/login", data={"username": email, "password": "sellerpass"}
    )
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


@pytest.mark.asyncio
async def test_update_profile_persists_all_business_fields(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Every field the SellerProfile form sends must round-trip through PUT
    and reappear on GET — guards against silent stripping by MerchantUpdate."""
    token = await _seller_token(client, db_session, "htx-full@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "shop_name": "HTX Cà Phê Đắk Lắk",
        "slug": "htx-ca-phe-dak-lak",
        "business_name": "HTX Sản Xuất & Kinh Doanh Cà Phê Hữu Cơ Đắk Lắk",
        "business_name_en": "Dak Lak Organic Coffee Cooperative",
        "description_vi": "Cà phê hữu cơ vùng cao",
        "description_en": "Highland organic coffee",
        "region": "Đắk Lắk",
        "established_year": 2018,
        "tax_id": "0312345678",
        "address": "12 Lê Lợi, P. Tân An, TP. Buôn Ma Thuột, Đắk Lắk",
        "phone": "0905123456",
        "email": "lienhe@htxcaphe.vn",
        "facebook": "htxcaphedaklak",
        "instagram": "htxcaphedaklak",
        "representative": "Y Thol Êban",
        "cccd": "066089012345",
        "member_count": 42,
        "entity_type": "cooperative",
        "certifications": ["VietGAP", "Organic EU", "Fair Trade"],
    }

    put = await client.put("/api/v1/seller/profile", json=payload, headers=headers)
    assert put.status_code == 200, put.text
    body = put.json()
    for key, value in payload.items():
        assert body[key] == value, f"PUT response stripped {key}"

    get = await client.get("/api/v1/seller/profile", headers=headers)
    assert get.status_code == 200, get.text
    fetched = get.json()
    for key, value in payload.items():
        assert fetched[key] == value, f"GET lost {key} after PUT"


@pytest.mark.asyncio
async def test_update_profile_partial_does_not_clear_other_fields(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """exclude_unset semantics: sending only one field must not wipe others."""
    token = await _seller_token(client, db_session, "htx-partial@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Seed with full payload
    seed = {
        "tax_id": "0987654321",
        "address": "1 Hùng Vương, Đà Nẵng",
        "member_count": 17,
        "entity_type": "cooperative",
        "certifications": ["VietGAP"],
    }
    seed_put = await client.put("/api/v1/seller/profile", json=seed, headers=headers)
    assert seed_put.status_code == 200

    # Touch only member_count
    bump = await client.put(
        "/api/v1/seller/profile", json={"member_count": 25}, headers=headers
    )
    assert bump.status_code == 200
    body = bump.json()
    assert body["member_count"] == 25
    assert body["tax_id"] == seed["tax_id"]
    assert body["address"] == seed["address"]
    assert body["entity_type"] == seed["entity_type"]
    assert body["certifications"] == seed["certifications"]


@pytest.mark.asyncio
async def test_update_profile_accepts_nullable_clears(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Explicit null must clear the column (vs. omitting the key)."""
    token = await _seller_token(client, db_session, "htx-null@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    await client.put(
        "/api/v1/seller/profile",
        json={"phone": "0900000000", "email": "x@y.vn"},
        headers=headers,
    )
    cleared = await client.put(
        "/api/v1/seller/profile",
        json={"phone": None, "email": None},
        headers=headers,
    )
    assert cleared.status_code == 200
    body = cleared.json()
    assert body["phone"] is None
    assert body["email"] is None


@pytest.mark.asyncio
async def test_update_profile_requires_auth(client: AsyncClient) -> None:
    resp = await client.put("/api/v1/seller/profile", json={"shop_name": "X"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_profile_exposes_new_fields_as_null_when_unset(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """A freshly-created merchant must expose all extended fields as null,
    not 422 or missing-key — the frontend reads them unconditionally."""
    token = await _seller_token(client, db_session, "htx-blank@test.com")
    resp = await client.get(
        "/api/v1/seller/profile", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    body = resp.json()
    for key in (
        "business_name",
        "business_name_en",
        "tax_id",
        "address",
        "phone",
        "email",
        "facebook",
        "instagram",
        "representative",
        "cccd",
        "member_count",
        "entity_type",
        "certifications",
    ):
        assert key in body, f"GET /seller/profile missing key: {key}"
        assert body[key] is None, f"{key} should default to null on fresh merchant"
