from pydantic import BaseModel
from typing import Optional, List
from app.domains.marketplace.models import RequestStatus, OrderStatus, ProposalStatus


class MarketRequestBase(BaseModel):
    commodity: str
    target_quantity: float
    target_price: Optional[float] = None


class MarketRequestCreate(MarketRequestBase):
    pass


class MarketRequest(MarketRequestBase):
    id: int
    customer_id: int
    status: RequestStatus

    class Config:
        from_attributes = True


class ContributionDetail(BaseModel):
    id: int
    farmer_id: int
    quantity: float
    price_bid: float

    class Config:
        from_attributes = True


class LobbyDetail(BaseModel):
    id: int
    commodity: str
    target_quantity: float
    current_quantity: float
    status: str
    contributions: List[ContributionDetail] = []

    class Config:
        from_attributes = True


class MarketRequestDetail(BaseModel):
    """Extended schema for customer view with lobby + contributions."""
    id: int
    customer_id: int
    commodity: str
    target_quantity: float
    target_price: Optional[float] = None
    status: RequestStatus
    lobby: Optional[LobbyDetail] = None

    class Config:
        from_attributes = True


class ProposalBase(BaseModel):
    lobby_id: int
    proposed_price: float
    notes: Optional[str] = None


class ProposalCreate(ProposalBase):
    pass


class Proposal(ProposalBase):
    id: int
    customer_id: int
    status: ProposalStatus

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    proposal_id: int
    total_amount: float


class Order(OrderBase):
    id: int
    customer_id: int
    status: OrderStatus
    rating: Optional[int] = None
    feedback: Optional[str] = None

    class Config:
        from_attributes = True


class FarmerInfo(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True


class ContributionWithFarmer(BaseModel):
    id: int
    farmer_id: int
    quantity: float
    price_bid: float
    farmer: Optional[FarmerInfo] = None

    class Config:
        from_attributes = True


class LobbyForOrder(BaseModel):
    id: int
    commodity: str
    target_quantity: float
    current_quantity: float
    status: str
    contributions: List[ContributionWithFarmer] = []

    class Config:
        from_attributes = True


class ProposalForOrder(BaseModel):
    id: int
    lobby_id: int
    proposed_price: float
    notes: Optional[str] = None
    status: ProposalStatus
    lobby: Optional[LobbyForOrder] = None

    class Config:
        from_attributes = True


class OrderDetail(BaseModel):
    """Extended order schema with proposal, lobby, and farmer details."""
    id: int
    proposal_id: int
    customer_id: int
    total_amount: float
    status: OrderStatus
    rating: Optional[int] = None
    feedback: Optional[str] = None
    created_at: Optional[str] = None
    proposal: Optional[ProposalForOrder] = None

    class Config:
        from_attributes = True
