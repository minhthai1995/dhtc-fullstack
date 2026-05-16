from pydantic import BaseModel, ConfigDict, EmailStr


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    is_active: bool


class UserUpdate(BaseModel):
    email: EmailStr | None = None
