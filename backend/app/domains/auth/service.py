from datetime import datetime, timedelta
from typing import Optional, Any, Union
from jose import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from prisma import Prisma

from app.core.config import settings
from app.domains.auth.repository import UserRepository
from app.domains.auth.schemas import UserCreate, Token, UserUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: Prisma):
        self.user_repo = UserRepository(db)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def create_token(self, data: dict, expires_delta: Optional[timedelta] = None, is_refresh: bool = False) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES if not is_refresh else settings.REFRESH_TOKEN_EXPIRE_DAYS * 1440
            expire = datetime.utcnow() + timedelta(minutes=minutes)
        
        to_encode.update({"exp": expire, "type": "refresh" if is_refresh else "access"})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    async def authenticate_user(self, email: str, password: str) -> Optional[Any]:
        user = await self.user_repo.get_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    async def register_user(self, user_in: UserCreate) -> Any:
        existing_user = await self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
        
        user_data = user_in.model_dump(exclude={"password"})
        user_data["hashed_password"] = self.get_password_hash(user_in.password)
        # Add role from UserCreate if present
        if hasattr(user_in, "role") and user_in.role:
            user_data["role"] = user_in.role
        return await self.user_repo.create(user_data)
