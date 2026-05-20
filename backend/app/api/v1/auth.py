from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.crud import user as user_crud
from app.deps import current_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenResponse
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    existing = await user_crud.get_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = await user_crud.create_user(db, body.email, body.password, body.role)
    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    user = await user_crud.authenticate(db, form.username, form.password)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    token = create_access_token(str(user.id), extra_claims={"role": user.role.value})
    return TokenResponse(access_token=token)


@router.patch("/password", status_code=204)
async def change_password(
    body: PasswordChange,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")
    user.hashed_password = hash_password(body.new_password)
    await db.commit()
