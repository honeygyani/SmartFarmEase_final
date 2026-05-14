from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from prisma import Prisma

from app.db.session import get_db, db as prisma_db
from app.domains.lobby.service import LobbyService
from app.domains.lobby.schemas import (
    LobbyCreate, Lobby, ContributionCreate, Contribution, LobbyMessage,
    FarmerPublishRequest, LobbyMarketplaceListing, DirectBuyRequest
)
from app.core.dependencies import get_farmer, get_current_user, get_customer

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, lobby_id: int, websocket: WebSocket):
        await websocket.accept()
        if lobby_id not in self.active_connections:
            self.active_connections[lobby_id] = []
        self.active_connections[lobby_id].append(websocket)

    def disconnect(self, lobby_id: int, websocket: WebSocket):
        if lobby_id in self.active_connections:
            self.active_connections[lobby_id].remove(websocket)

    async def broadcast(self, lobby_id: int, message: dict):
        if lobby_id in self.active_connections:
            for connection in self.active_connections[lobby_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.post("/", response_model=Lobby)
async def create_lobby(
    lobby_in: LobbyCreate,
    db: Prisma = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    service = LobbyService(db)
    return await service.create_lobby(lobby_in)

@router.post("/contributions", response_model=Contribution)
async def contribute_to_lobby(
    contribution_in: ContributionCreate,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = LobbyService(db)
    return await service.add_contribution(current_farmer.id, contribution_in)

@router.get("/active", response_model=List[Lobby])
async def list_active_lobbies(
    commodity: Optional[str] = None,
    db: Prisma = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    service = LobbyService(db)
    return await service.get_active_lobbies(commodity)

@router.get("/my-lobbies", response_model=List[Lobby])
async def list_my_lobbies(
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    service = LobbyService(db)
    return await service.get_farmer_lobbies(current_farmer.id)

# ── Farmer Lobby Marketplace routes ──

@router.post("/farmer-publish")
async def publish_to_lobby(
    publish_in: FarmerPublishRequest,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    """Farmer publishes one of their available inventory items to the shared lobby marketplace."""
    service = LobbyService(db)
    try:
        result = await service.publish_farmer_inventory(
            current_farmer.id,
            publish_in.inventory_id,
            publish_in.quality_score or 100.0
        )
        return {"message": "Published to lobby marketplace successfully", "lobby_id": result.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/marketplace-listings", response_model=List[LobbyMarketplaceListing])
async def get_marketplace_listings(
    db: Prisma = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Return all farmer-initiated crop listings visible in the Customer Marketplace Lobby."""
    service = LobbyService(db)
    return await service.get_marketplace_listings()


@router.get("/your-lobby", response_model=List[LobbyMarketplaceListing])
async def get_your_lobby(
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    """Return farmer listings that match the customer's active sourcing requests (personalised view)."""
    service = LobbyService(db)
    return await service.get_customer_matched_listings(current_customer.id)


@router.get("/my-contributions")
async def get_my_contributions(
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    """Return all open-lobby contributions for the current farmer (Crops in Lobby)."""
    service = LobbyService(db)
    contributions = await service.get_farmer_contributions(current_farmer.id)
    # Shape for the frontend: flatten lobby info into each contribution
    result = []
    for c in contributions:
        result.append({
            "id": c.id,
            "lobby_id": c.lobby_id,
            "commodity": c.lobby.commodity if c.lobby else "",
            "quantity": c.quantity,
            "price_bid": c.price_bid,
            "aggregate_health_score": c.lobby.aggregate_health_score if c.lobby else 100.0,
            "lobby_status": c.lobby.status if c.lobby else "open"
        })
    return result


@router.get("/peer-contributions")
async def get_peer_contributions(
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    """Return active lobby contributors for crops the current farmer has joined."""
    service = LobbyService(db)
    contributions = await service.get_farmer_lobby_peers(current_farmer.id)
    return [
        {
            "id": c.id,
            "lobby_id": c.lobby_id,
            "commodity": c.lobby.commodity if c.lobby else "",
            "farmer_id": c.farmer_id,
            "farmer_name": (c.farmer.full_name or c.farmer.email) if c.farmer else "Farmer",
            "quantity": c.quantity,
            "price_bid": c.price_bid,
            "lobby_status": c.lobby.status if c.lobby else "open",
            "is_mine": c.farmer_id == current_farmer.id,
        }
        for c in contributions
    ]


@router.patch("/contribution/{contribution_id}/price")
async def update_contribution_price(
    contribution_id: int,
    price_bid: float,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    """Update the current farmer's own listed lobby price."""
    service = LobbyService(db)
    try:
        contribution = await service.update_contribution_price(
            current_farmer.id,
            contribution_id,
            price_bid
        )
        return {
            "id": contribution.id,
            "lobby_id": contribution.lobby_id,
            "commodity": contribution.lobby.commodity if contribution.lobby else "",
            "farmer_id": contribution.farmer_id,
            "farmer_name": (contribution.farmer.full_name or contribution.farmer.email) if contribution.farmer else "Farmer",
            "quantity": contribution.quantity,
            "price_bid": contribution.price_bid,
            "lobby_status": contribution.lobby.status if contribution.lobby else "open",
            "is_mine": True,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/contribution/{contribution_id}")
async def remove_contribution(
    contribution_id: int,
    db: Prisma = Depends(get_db),
    current_farmer: Any = Depends(get_farmer)
):
    """Farmer removes their own contribution from a lobby."""
    service = LobbyService(db)
    try:
        await service.remove_contribution(current_farmer.id, contribution_id)
        return {"detail": "Removed from lobby"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{lobby_id}/direct-buy")
async def direct_buy(
    lobby_id: int,
    buy_in: DirectBuyRequest,
    db: Prisma = Depends(get_db),
    current_customer: Any = Depends(get_customer)
):
    """Customer buys directly from a farmer marketplace listing."""
    service = LobbyService(db)
    try:
        order = await service.direct_buy_from_lobby(
            current_customer.id, lobby_id, buy_in.payment_method, buy_in.contribution_id
        )
        return {"order_id": order.id, "status": order.status, "total_amount": order.total_amount}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{lobby_id}/history", response_model=List[LobbyMessage])
async def get_lobby_history(
    lobby_id: int,
    db: Prisma = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    service = LobbyService(db)
    messages = await service.get_chat_history(lobby_id)
    return [
        {
            "id": m.id,
            "lobby_id": m.lobby_id,
            "sender_id": m.sender_id,
            "content": m.content,
            "created_at": m.created_at,
            "sender_name": (m.sender.full_name or m.sender.email) if m.sender else "User"
        } for m in messages
    ]

@router.websocket("/{lobby_id}/ws")
async def websocket_endpoint(websocket: WebSocket, lobby_id: int):
    await manager.connect(lobby_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Note: We use the global prisma_db here as it's already connected in lifespan
            service = LobbyService(prisma_db)
            msg = await service.create_message(
                lobby_id=lobby_id,
                sender_id=data["sender_id"],
                content=data["content"]
            )
            broadcast_data = {
                "id": msg.id,
                "lobby_id": lobby_id,
                "sender_id": msg.sender_id,
                "sender_name": data.get("sender_name", "User"),
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            await manager.broadcast(lobby_id, broadcast_data)
    except WebSocketDisconnect:
        manager.disconnect(lobby_id, websocket)
