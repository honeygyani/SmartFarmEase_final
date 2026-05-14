from typing import List, Optional, Any
from fastapi import HTTPException, status
from app.domains.inventory.repository import InventoryRepository
from app.domains.inventory.schemas import InventoryCreate, InventoryUpdate
from prisma import Prisma

class InventoryService:
    def __init__(self, db: Prisma):
        self.repo = InventoryRepository(db)

    async def add_item(self, farmer_id: int, item_in: InventoryCreate) -> Any:
        data = item_in.model_dump()
        data["farmer_id"] = farmer_id
        return await self.repo.create(data)

    async def update_item(self, farmer_id: int, item_id: int, item_in: InventoryUpdate) -> Any:
        item = await self.repo.get(item_id)
        if not item or item.farmer_id != farmer_id:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        update_data = item_in.model_dump(exclude_unset=True)
        update_data["version"] = (item.version or 1) + 1
        return await self.repo.update(item_id, update_data)

    async def delete_item(self, farmer_id: int, item_id: int) -> None:
        item = await self.repo.get(item_id)
        if not item or item.farmer_id != farmer_id:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        await self.repo.delete(item_id)

    async def get_farmer_inventory(self, farmer_id: int) -> List[Any]:
        return await self.repo.get_by_farmer_id(farmer_id)
