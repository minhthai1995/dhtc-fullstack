from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole


async def get_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def authenticate(db: AsyncSession, email: str, password: str) -> User | None:
    user = await get_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


async def create_user(
    db: AsyncSession,
    email: str,
    password: str,
    role: UserRole | None = None,
    full_name: str | None = None,
    phone: str | None = None,
) -> User:
    user = User(
        email=email,
        hashed_password=hash_password(password),
        role=role or UserRole.customer,
        full_name=full_name,
        phone=phone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
