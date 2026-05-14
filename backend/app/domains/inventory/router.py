from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from prisma import Prisma

from app.db.session import get_db
from app.domains.inventory.service import InventoryService
from app.domains.inventory.schemas import InventoryCreate, InventoryUpdate, InventoryInDB
from app.core.dependencies import get_farmer

router = APIRouter()

@router.post("/", response_model=InventoryInDB)
async def create_item(
    item_in: InventoryCreate,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = InventoryService(db)
    return await service.add_item(current_farmer.id, item_in)

@router.get("/me", response_model=List[InventoryInDB])
async def list_my_inventory(
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = InventoryService(db)
    return await service.get_farmer_inventory(current_farmer.id)

@router.put("/{item_id}", response_model=InventoryInDB)
async def update_item(
    item_id: int,
    item_in: InventoryUpdate,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = InventoryService(db)
    return await service.update_item(current_farmer.id, item_id, item_in)

@router.delete("/{item_id}")
async def delete_item(
    item_id: int,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = InventoryService(db)
    await service.delete_item(current_farmer.id, item_id)
    return {"detail": "Item deleted"}
