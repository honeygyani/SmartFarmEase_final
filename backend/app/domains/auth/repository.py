from typing import Optional, Any
from app.db.repository import BaseRepository
from prisma import Prisma

class UserRepository(BaseRepository):
    def __init__(self, db: Prisma):
        super().__init__("user", db)

    async def get_by_email(self, email: str) -> Optional[Any]:
        return await self.model_delegate.find_unique(where={"email": email})
