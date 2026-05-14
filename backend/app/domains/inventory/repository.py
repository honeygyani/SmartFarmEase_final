from typing import List, Optional, Any
from app.db.repository import BaseRepository
from prisma import Prisma

class InventoryRepository(BaseRepository):
    def __init__(self, db: Prisma):
        super().__init__("inventory", db)

    async def get_by_farmer_id(self, farmer_id: int) -> List[Any]:
        return await self.model_delegate.find_many(where={"farmer_id": farmer_id})
