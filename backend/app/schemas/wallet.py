from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.wallet import TransactionType


class WalletTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: TransactionType
    amount: float
    balance_after: float
    description: str | None
    created_at: datetime


class WalletSummary(BaseModel):
    balance: float
    total_sales: float
    total_withdrawals: float
    pending_orders: int


class WithdrawRequest(BaseModel):
    amount: float
    bank_account: str
    bank_name: str
