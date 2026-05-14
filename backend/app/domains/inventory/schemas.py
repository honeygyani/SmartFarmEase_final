from pydantic import BaseModel, Field
from typing import Optional
import enum


class InventoryStatus(str, enum.Enum):
    AVAILABLE = "available"
    COMMITTED = "committed"
    SOLD = "sold"


class InventoryBase(BaseModel):
    commodity: str
    quantity: float
    price_per_unit: float
    unit: str


class InventoryCreate(InventoryBase):
    pass


class InventoryUpdate(BaseModel):
    commodity: Optional[str] = None
    quantity: Optional[float] = None
    price_per_unit: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[InventoryStatus] = None


class InventoryInDB(InventoryBase):
    id: int
    farmer_id: int
    status: InventoryStatus = InventoryStatus.AVAILABLE
    version: int

    class Config:
        from_attributes = True
