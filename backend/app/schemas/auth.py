from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole = UserRole.customer
