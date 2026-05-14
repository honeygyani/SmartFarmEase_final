from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from prisma import Prisma

from app.db.session import get_db
from app.domains.marketplace.service import MarketplaceService
from app.domains.marketplace.schemas import MarketRequestCreate, MarketRequest, MarketRequestDetail, ProposalCreate, Proposal, Order, OrderDetail
from app.core.dependencies import get_customer, get_farmer, get_current_user

router = APIRouter()

@router.post("/requests", response_model=MarketRequest)
async def create_market_request(
    request_in: MarketRequestCreate,
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    service = MarketplaceService(db)
    return await service.create_request(current_customer.id, request_in)

@router.get("/requests/me", response_model=List[MarketRequestDetail])
async def list_my_requests(
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    service = MarketplaceService(db)
    return await service.get_customer_requests(current_customer.id)

@router.get("/requests/active", response_model=List[MarketRequestDetail])
async def list_active_requests(
    db: Prisma = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    service = MarketplaceService(db)
    return await service.get_active_market_requests()

@router.post("/proposals", response_model=Proposal)
async def create_proposal(
    proposal_in: ProposalCreate,
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    service = MarketplaceService(db)
    try:
        return await service.create_proposal(
            customer_id=current_customer.id,
            lobby_id=proposal_in.lobby_id,
            proposed_price=proposal_in.proposed_price,
            notes=proposal_in.notes or ""
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/lobby/{lobby_id}/proposals", response_model=List[Proposal])
async def list_lobby_proposals(
    lobby_id: int,
    db: Prisma = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    service = MarketplaceService(db)
    return await service.get_lobby_proposals(lobby_id)

@router.post("/proposals/{proposal_id}/vote")
async def vote_proposal(
    proposal_id: int,
    agree: bool,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = MarketplaceService(db)
    return await service.vote_on_proposal(proposal_id, current_farmer.id, agree)

@router.post("/proposals/{proposal_id}/veto", response_model=Proposal)
async def veto_proposal(
    proposal_id: int,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = MarketplaceService(db)
    try:
        return await service.veto_proposal(proposal_id, current_farmer.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/orders/{order_id}/rate", response_model=Order)
async def rate_order(
    order_id: int,
    rating: int,
    feedback: str = "",
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    service = MarketplaceService(db)
    try:
        return await service.rate_order(order_id, rating, feedback)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/me")
async def list_my_orders(
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    service = MarketplaceService(db)
    return await service.get_customer_orders(current_customer.id)


@router.post("/orders/{order_id}/pay", response_model=Order)
async def pay_order(
    order_id: int,
    payment_method: str = "upi",
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    service = MarketplaceService(db)
    try:
        return await service.pay_order(current_customer.id, order_id, payment_method)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/orders/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: int,
    new_status: str,
    db: Prisma = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    service = MarketplaceService(db)
    try:
        return await service.update_order_status(order_id, new_status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requests/{request_id}/confirm", response_model=Order)
async def confirm_request(
    request_id: int,
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    service = MarketplaceService(db)
    try:
        return await service.confirm_request(current_customer.id, request_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/requests/{request_id}/offers")
async def get_request_offers(
    request_id: int,
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    service = MarketplaceService(db)
    try:
        return await service.get_request_with_offers(current_customer.id, request_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/requests/{request_id}")
async def delete_request(
    request_id: int,
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    service = MarketplaceService(db)
    try:
        await service.delete_request(current_customer.id, request_id)
        return {"detail": "Request deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/orders/farmer-active")
async def list_farmer_orders(
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = MarketplaceService(db)
    return await service.get_farmer_orders(current_farmer.id)


@router.post("/orders/{order_id}/track", response_model=Order)
async def track_order(
    order_id: int,
    new_status: str,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = MarketplaceService(db)
    try:
        return await service.track_order(current_farmer.id, order_id, new_status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/proposals/{proposal_id}/accept", response_model=Order)
async def accept_proposal(
    proposal_id: int,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = MarketplaceService(db)
    try:
        return await service.accept_proposal(proposal_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
