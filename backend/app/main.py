from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import db

from app.domains.auth.router import router as auth_router
from app.domains.ai_gateway.router import router as ai_router
from app.domains.inventory.router import router as inventory_router
from app.domains.marketplace.router import router as marketplace_router
from app.domains.lobby.router import router as lobby_router
from app.domains.sowing_window.router import router as sowing_window_router

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to Prisma
    await db.connect()
    yield
    # Disconnect from Prisma
    if db.is_connected():
        await db.disconnect()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI Services"])
app.include_router(inventory_router, prefix="/api/v1/inventory", tags=["Inventory"])
app.include_router(marketplace_router, prefix="/api/v1/marketplace", tags=["Marketplace"])
app.include_router(lobby_router, prefix="/api/v1/lobby", tags=["Lobby & Matching"])
app.include_router(sowing_window_router, prefix="/api/v1/sowing-window", tags=["Sowing Window"])

@app.get("/")
async def root():
    return {"message": "Welcome to SmartFarmEase API (Powered by Prisma)", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
