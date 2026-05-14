from typing import List, Optional, Any
from fastapi import HTTPException
from prisma import Prisma
from prisma.enums import LobbyStatus

from app.db.repository import BaseRepository
from app.domains.lobby.schemas import LobbyCreate, ContributionCreate

class LobbyService:
    def __init__(self, db: Prisma):
        self.db = db
        self.lobby_repo = BaseRepository("lobby", db)
        self.contribution_repo = BaseRepository("contribution", db)
        self.message_repo = BaseRepository("lobbymessage", db)

    async def create_lobby(self, lobby_in: LobbyCreate) -> Any:
        return await self.lobby_repo.create(lobby_in.model_dump())

    async def add_contribution(self, farmer_id: int, contribution_in: ContributionCreate) -> Any:
        # 1. Add the contribution
        data = contribution_in.model_dump()
        data["farmer_id"] = farmer_id
        contribution = await self.contribution_repo.create(data)

        # 2. Assign Leader if first
        lobby = await self.db.lobby.find_unique(where={"id": contribution.lobby_id})
        if lobby and lobby.leader_id is None:
            await self.db.lobby.update(
                where={"id": contribution.lobby_id},
                data={"leader_id": farmer_id}
            )

        # 3. Update Stats
        await self._refresh_lobby_stats(contribution.lobby_id)
        return contribution

    async def _refresh_lobby_stats(self, lobby_id: int):
        lobby = await self.db.lobby.find_unique(
            where={"id": lobby_id},
            include={"contributions": True}
        )
        if not lobby: return

        current_quantity = sum(c.quantity for c in (lobby.contributions or []))
        aggregate_health_score = 95.0 

        status = lobby.status
        if current_quantity >= lobby.target_quantity and status == LobbyStatus.open:
            status = LobbyStatus.ready
        
        await self.db.lobby.update(
            where={"id": lobby_id},
            data={
                "current_quantity": current_quantity,
                "aggregate_health_score": aggregate_health_score,
                "status": status
            }
        )

    async def get_active_lobbies(self, commodity: Optional[str] = None) -> List[Any]:
        where = {"status": LobbyStatus.ready}
        if commodity:
            where["commodity"] = {"contains": commodity, "mode": "insensitive"}
        return await self.db.lobby.find_many(where=where)

    async def get_farmer_lobbies(self, farmer_id: int) -> List[Any]:
        return await self.db.lobby.find_many(
            where={
                "contributions": {
                    "some": {
                        "farmer_id": farmer_id
                    }
                }
            }
        )

    async def create_message(self, lobby_id: int, sender_id: int, content: str) -> Any:
        return await self.message_repo.create({"lobby_id": lobby_id, "sender_id": sender_id, "content": content})

    async def get_chat_history(self, lobby_id: int, limit: int = 50) -> List[Any]:
        return await self.db.lobbymessage.find_many(
            where={"lobby_id": lobby_id},
            include={"sender": True},
            order={"created_at": "asc"},
            take=limit
        )

    # ── Farmer Lobby Marketplace methods ──

    async def publish_farmer_inventory(self, farmer_id: int, inventory_id: int, quality_score: float = 100.0) -> Any:
        """Farmer publishes an inventory item to the shared lobby marketplace.
        Creates a new farmer-initiated Lobby (no request_id) plus a Contribution record.
        Each farmer gets their own lobby so they appear as separate listings."""
        inventory_item = await self.db.inventory.find_unique(where={"id": inventory_id})
        if not inventory_item:
            raise ValueError("Inventory item not found")
        if inventory_item.farmer_id != farmer_id:
            raise ValueError("This inventory item does not belong to you")
        if str(inventory_item.status) != "available":
            raise ValueError("Only available inventory items can be published to the lobby")

        # Clamp quality score to valid range
        quality_score = max(0.0, min(100.0, quality_score))

        # Create a farmer-initiated lobby (no request_id)
        lobby = await self.db.lobby.create(data={
            "commodity": inventory_item.commodity,
            "target_quantity": inventory_item.quantity,
            "aggregate_health_score": quality_score,
            "status": LobbyStatus.open,
        })

        # Add the farmer's contribution to this lobby
        await self.contribution_repo.create({
            "lobby_id": lobby.id,
            "farmer_id": farmer_id,
            "quantity": inventory_item.quantity,
            "price_bid": inventory_item.price_per_unit,
        })

        # Update current_quantity and set the farmer as lobby leader
        await self.db.lobby.update(
            where={"id": lobby.id},
            data={
                "current_quantity": inventory_item.quantity,
                "leader_id": farmer_id,
            }
        )

        return await self.db.lobby.find_unique(
            where={"id": lobby.id},
            include={"contributions": {"include": {"farmer": True}}}
        )



    async def get_marketplace_listings(self) -> List[Any]:
        """Return all active lobby listings with contributions to display in the marketplace."""
        return await self.db.lobby.find_many(
            where={
                "status": {"in": [LobbyStatus.open, LobbyStatus.ready]},
                "contributions": {"some": {}}
            },
            include={
                "contributions": {
                    "include": {"farmer": True}
                }
            },
            order={"created_at": "desc"}
        )

    async def get_customer_matched_listings(self, customer_id: int) -> List[Any]:
        """Return farmer marketplace listings whose commodity matches the customer's
        active sourcing requests — the 'Your Lobby' personalised view."""
        active_requests = await self.db.marketrequest.find_many(
            where={"customer_id": customer_id, "status": "pending"}
        )
        if not active_requests:
            return []

        customer_commodities = {r.commodity.lower() for r in active_requests}
        all_listings = await self.get_marketplace_listings()
        return [
            listing for listing in all_listings
            if listing.commodity.lower() in customer_commodities
        ]

    async def get_farmer_contributions(self, farmer_id: int) -> List[Any]:
        """Return all open-lobby contributions for a farmer (Crops in Lobby view)."""
        return await self.db.contribution.find_many(
            where={
                "farmer_id": farmer_id,
                "lobby": {
                    "status": {"in": [LobbyStatus.open, LobbyStatus.ready]}
                }
            },
            include={"lobby": True}
        )

    async def get_farmer_lobby_peers(self, farmer_id: int) -> List[Any]:
        """Return active contributions for commodities the farmer has joined."""
        my_contributions = await self.get_farmer_contributions(farmer_id)
        commodities = {
            c.lobby.commodity for c in my_contributions
            if c.lobby and c.lobby.commodity
        }
        if not commodities:
            return []

        return await self.db.contribution.find_many(
            where={
                "lobby": {
                    "commodity": {"in": list(commodities)},
                    "status": {"in": [LobbyStatus.open, LobbyStatus.ready]}
                }
            },
            include={
                "farmer": True,
                "lobby": True
            },
            order={"created_at": "desc"}
        )

    async def update_contribution_price(self, farmer_id: int, contribution_id: int, price_bid: float) -> Any:
        """Allow a farmer to update only their own listed lobby price."""
        if price_bid < 0:
            raise ValueError("Price cannot be negative")

        contribution = await self.db.contribution.find_unique(where={"id": contribution_id})
        if not contribution:
            raise ValueError("Contribution not found")
        if contribution.farmer_id != farmer_id:
            raise ValueError("This contribution does not belong to you")

        return await self.db.contribution.update(
            where={"id": contribution_id},
            data={"price_bid": price_bid},
            include={"farmer": True, "lobby": True}
        )

    async def remove_contribution(self, farmer_id: int, contribution_id: int) -> None:
        """Farmer removes their own contribution from a lobby."""
        contribution = await self.db.contribution.find_unique(
            where={"id": contribution_id},
            include={"lobby": True}
        )
        if not contribution:
            raise ValueError("Contribution not found")
        if contribution.farmer_id != farmer_id:
            raise ValueError("This contribution does not belong to you")

        lobby = contribution.lobby
        await self.db.contribution.delete(where={"id": contribution_id})

        if lobby:
            # Recalculate lobby stats after removal
            remaining = await self.db.contribution.find_many(
                where={"lobby_id": lobby.id}
            )
            new_qty = sum(c.quantity for c in remaining)

            # If this was a farmer-initiated solo lobby (no request, no remaining contributors), delete it
            if not remaining and lobby.request_id is None:
                await self.db.lobbymessage.delete_many(where={"lobby_id": lobby.id})
                await self.db.lobby.delete(where={"id": lobby.id})
            else:
                new_status = lobby.status
                if new_qty < lobby.target_quantity and str(lobby.status) == "ready":
                    new_status = LobbyStatus.open
                await self.db.lobby.update(
                    where={"id": lobby.id},
                    data={"current_quantity": new_qty, "status": new_status}
                )

    async def direct_buy_from_lobby(
        self, customer_id: int, lobby_id: int, payment_method: str, contribution_id: int = None
    ) -> Any:
        """Customer buys directly from a farmer marketplace listing.
        Creates an auto-accepted proposal + order.
        If contribution_id is provided, only that farmer's contribution is used for the order."""
        from prisma.enums import ProposalStatus, OrderStatus as PrismaOrderStatus

        lobby = await self.db.lobby.find_unique(
            where={"id": lobby_id},
            include={"contributions": True}
        )
        if not lobby:
            raise ValueError("Lobby not found")
        if str(lobby.status) not in ("open", "ready"):
            raise ValueError("This listing is no longer available")

        # If a specific contribution is targeted, use only that contribution
        if contribution_id:
            target_contributions = [
                c for c in (lobby.contributions or []) if c.id == contribution_id
            ]
            if not target_contributions:
                raise ValueError("Contribution not found in this lobby")
            total_amount = sum(c.quantity * c.price_bid for c in target_contributions)
        else:
            total_amount = sum(
                c.quantity * c.price_bid for c in (lobby.contributions or [])
            )

        if total_amount == 0:
            total_amount = lobby.current_quantity * 0  # fallback; price might be 0

        # Create an auto-accepted proposal
        proposal = await self.db.proposal.create(data={
            "customer_id": customer_id,
            "lobby_id": lobby_id,
            "proposed_price": total_amount,
            "notes": f"Direct buy via {payment_method}" + (f" (contribution #{contribution_id})" if contribution_id else ""),
            "status": ProposalStatus.accepted
        })

        # Determine order status based on payment method
        order_status = PrismaOrderStatus.paid if payment_method != "cod" else PrismaOrderStatus.created

        # Create the order
        order = await self.db.order.create(data={
            "proposal_id": proposal.id,
            "customer_id": customer_id,
            "total_amount": total_amount,
            "status": order_status
        })

        # Close the lobby
        await self.db.lobby.update(
            where={"id": lobby_id},
            data={"status": LobbyStatus.closed}
        )

        return order

