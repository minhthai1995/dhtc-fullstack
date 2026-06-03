from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

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
    last_bank_name: str | None = None
    last_bank_account: str | None = None


class WithdrawRequest(BaseModel):
    amount: float = Field(gt=0)
    bank_account: str = Field(min_length=1, max_length=64)
    bank_name: str = Field(min_length=1, max_length=100)
