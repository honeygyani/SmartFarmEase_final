from typing import Generator, Optional, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from prisma import Prisma
from prisma.enums import UserRole

from app.core.config import settings
from app.db.session import get_db
from app.domains.auth.repository import UserRepository
from app.domains.auth.schemas import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)

async def get_current_user(
    db: Prisma = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> Any:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, Exception):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials: Signature has expired.",
        )
    
    user_repo = UserRepository(db)
    # Token data sub might be string or int
    user_id = int(token_data.sub) if isinstance(token_data.sub, str) and token_data.sub.isdigit() else token_data.sub
    user = await user_repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

class RoleChecker:
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Any = Depends(get_current_user)):
        # Prisma enums might be strings or actual enum members
        # In prisma-client-py, they are usually the actual values if used as strings
        # or members of the Enum class.
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user doesn't have enough privileges"
            )
        return user

get_farmer = RoleChecker([UserRole.farmer, UserRole.admin])
get_customer = RoleChecker([UserRole.customer, UserRole.admin])
