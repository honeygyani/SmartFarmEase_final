from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from prisma import Prisma

from app.core.config import settings
from app.db.session import get_db
from app.domains.auth.service import AuthService
from app.domains.auth.schemas import User, UserCreate, Token
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/register", response_model=User)
async def register(user_in: UserCreate, db: Prisma = Depends(get_db)):
    auth_service = AuthService(db)
    return await auth_service.register_user(user_in)

@router.post("/login", response_model=Token)
async def login(db: Prisma = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = auth_service.create_token(
        data={"sub": str(user.id), "role": user.role, "full_name": user.full_name, "email": user.email}
    )
    refresh_token = auth_service.create_token(
        data={"sub": str(user.id)}, is_refresh=True
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=User)
async def get_me(current_user: Any = Depends(get_current_user)):
    return current_user
