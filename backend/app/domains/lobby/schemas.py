from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.domains.lobby.models import LobbyStatus

class LobbyBase(BaseModel):
    commodity: str
    target_quantity: float

class LobbyCreate(LobbyBase):
    request_id: Optional[int] = None

class LobbyUpdate(BaseModel):
    status: Optional[LobbyStatus] = None

class ContributionBase(BaseModel):
    quantity: float
    price_bid: float

class ContributionCreate(ContributionBase):
    lobby_id: int

class Contribution(ContributionBase):
    id: int
    lobby_id: int
    farmer_id: int

    class Config:
        from_attributes = True

class LobbyMessageBase(BaseModel):
    content: str

class LobbyMessageCreate(LobbyMessageBase):
    lobby_id: int

class LobbyMessage(LobbyMessageBase):
    id: int
    lobby_id: int
    sender_id: int
    created_at: datetime
    sender_name: Optional[str] = None # Added for convenience

    class Config:
        from_attributes = True

class Lobby(LobbyBase):
    id: int
    request_id: Optional[int]
    current_quantity: float
    aggregate_health_score: float
    status: LobbyStatus
    contributions: List[Contribution] = []

    class Config:
        from_attributes = True


# ── New schemas for Farmer Lobby Marketplace feature ──

class FarmerPublishRequest(BaseModel):
    """Request body for a farmer publishing an inventory item to the shared lobby marketplace."""
    inventory_id: int
    quality_score: Optional[float] = 100.0


class FarmerBriefInfo(BaseModel):
    """Minimal farmer info for marketplace listing display."""
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True


class ContributionListing(BaseModel):
    """Contribution detail enriched with farmer info for marketplace display."""
    id: int
    farmer_id: int
    quantity: float
    price_bid: float
    farmer: Optional[FarmerBriefInfo] = None

    class Config:
        from_attributes = True


class LobbyMarketplaceListing(BaseModel):
    """A farmer-published crop listing visible in the Customer Marketplace Lobby section."""
    id: int
    commodity: str
    target_quantity: float
    current_quantity: float
    aggregate_health_score: float
    status: str
    contributions: List[ContributionListing] = []

    class Config:
        from_attributes = True


class DirectBuyRequest(BaseModel):
    """Request body for a customer buying directly from a marketplace lobby listing."""
    payment_method: str  # 'card', 'upi', 'cod'
    payment_details: Optional[str] = None  # JSON-encoded details (simulated)
    contribution_id: Optional[int] = None  # If set, buy only from this specific farmer contribution


class ContributionInfo(BaseModel):
    """Minimal contribution info for Crops in Lobby view."""
    id: int
    lobby_id: int
    commodity: str
    quantity: float
    price_bid: float
    aggregate_health_score: float
    lobby_status: str

    class Config:
        from_attributes = True
