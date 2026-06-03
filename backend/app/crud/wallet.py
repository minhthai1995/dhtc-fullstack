from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.wallet import TransactionType, WalletTransaction


async def get_transactions(
    db: AsyncSession,
    merchant_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[WalletTransaction]:
    result = await db.execute(
        select(WalletTransaction)
        .where(WalletTransaction.merchant_id == merchant_id)
        .order_by(WalletTransaction.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_balance(db: AsyncSession, merchant_id: int) -> float:
    """Return current balance as the balance_after of the latest transaction."""
    result = await db.execute(
        select(WalletTransaction.balance_after)
        .where(WalletTransaction.merchant_id == merchant_id)
        .order_by(WalletTransaction.id.desc())
        .limit(1)
    )
    row = result.scalars().first()
    return float(row) if row is not None else 0.0


async def get_total_by_type(
    db: AsyncSession, merchant_id: int, tx_type: TransactionType
) -> float:
    result = await db.execute(
        select(func.coalesce(func.sum(WalletTransaction.amount), 0)).where(
            WalletTransaction.merchant_id == merchant_id,
            WalletTransaction.type == tx_type,
        )
    )
    return float(result.scalar_one())


async def add_transaction(
    db: AsyncSession,
    merchant_id: int,
    tx_type: TransactionType,
    amount: float,
    description: str | None = None,
    reference_order_id: int | None = None,
    bank_name: str | None = None,
    bank_account: str | None = None,
    commit: bool = True,
) -> WalletTransaction:
    # Lock the latest row to prevent concurrent double-spend / double-credit
    locked = await db.execute(
        select(WalletTransaction.balance_after)
        .where(WalletTransaction.merchant_id == merchant_id)
        .order_by(WalletTransaction.id.desc())
        .limit(1)
        .with_for_update()
    )
    row = locked.scalars().first()
    current_balance = float(row) if row is not None else 0.0
    if tx_type in (TransactionType.withdrawal, TransactionType.fee):
        if current_balance < abs(amount):
            raise ValueError("Insufficient balance")
        new_balance = current_balance - abs(amount)
        amount = -abs(amount)
    else:
        new_balance = current_balance + abs(amount)

    tx = WalletTransaction(
        merchant_id=merchant_id,
        type=tx_type,
        amount=amount,
        balance_after=new_balance,
        description=description,
        reference_order_id=reference_order_id,
        bank_name=bank_name,
        bank_account=bank_account,
    )
    db.add(tx)
    if commit:
        await db.commit()
        await db.refresh(tx)
    else:
        await db.flush()
    return tx


async def get_last_withdrawal_bank(
    db: AsyncSession, merchant_id: int
) -> tuple[str | None, str | None]:
    """Return (bank_name, bank_account) from the most recent withdrawal, or (None, None)."""
    result = await db.execute(
        select(WalletTransaction.bank_name, WalletTransaction.bank_account)
        .where(
            WalletTransaction.merchant_id == merchant_id,
            WalletTransaction.type == TransactionType.withdrawal,
            WalletTransaction.bank_name.isnot(None),
        )
        .order_by(WalletTransaction.id.desc())
        .limit(1)
    )
    row = result.first()
    if row is None:
        return None, None
    return row[0], row[1]
