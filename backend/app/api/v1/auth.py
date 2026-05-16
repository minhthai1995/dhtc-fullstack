from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import create_access_token
from app.crud import user as user_crud
from app.schemas.auth import RegisterRequest, TokenResponse
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


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
    user = await user_crud.create_user(db, body.email, body.password)
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
    return TokenResponse(access_token=create_access_token(str(user.id)))
