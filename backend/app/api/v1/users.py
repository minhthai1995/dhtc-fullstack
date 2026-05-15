from fastapi import APIRouter, Depends

from app.deps import current_user
from app.models.user import User
from app.schemas.auth import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(user: User = Depends(current_user)) -> User:
    return user
