import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Determine the directory where this file is located
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# The .env file should be in the 'backend' folder
ENV_FILE = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartFarmEase Backend"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # Increased from 30 to 1440 (24 hours)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""
    POSTGRES_HOST: str = ""
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[str] = None

    def model_post_init(self, __context) -> None:
        if not self.DATABASE_URL or "${" in self.DATABASE_URL:
            self.DATABASE_URL = f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # AI Services
    AI_DISEASE_URL: str
    AI_CROP_REC_URL: str
    AI_FERTILIZER_URL: str
    AI_PRICE_URL: str
    AI_SOWING_URL: str

    model_config = SettingsConfigDict(env_file=ENV_FILE, case_sensitive=True)

settings = Settings()
