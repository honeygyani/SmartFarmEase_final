from typing import List, Optional, Any
from prisma import Prisma
from prisma.enums import LobbyStatus, ProposalStatus, OrderStatus

from app.db.repository import BaseRepository
from app.domains.marketplace.schemas import MarketRequestCreate, ProposalCreate

class MarketplaceService:
    def __init__(self, db: Prisma):
        self.db = db
        self.request_repo = BaseRepository("marketrequest", db)
        self.proposal_repo = BaseRepository("proposal", db)
        self.order_repo = BaseRepository("order", db)
        self.vote_repo = BaseRepository("proposalvote", db)

    async def create_request(self, customer_id: int, request_in: MarketRequestCreate) -> Any:
        data = request_in.model_dump()
        data["customer_id"] = customer_id
        request = await self.request_repo.create(data)
        
        lobby_data = {
            "request_id": request.id,
            "commodity": request.commodity,
            "target_quantity": request.target_quantity,
            "status": LobbyStatus.open
        }
        await self.db.lobby.create(data=lobby_data)
        return request

    async def create_proposal(self, customer_id: int, lobby_id: int, proposed_price: float, notes: str = ""):
        lobby = await self.db.lobby.find_unique(where={"id": lobby_id})
        if not lobby or lobby.status != LobbyStatus.ready:
            raise ValueError("Lobby is not ready for proposals")
        
        proposal = await self.proposal_repo.create({
            "customer_id": customer_id, 
            "lobby_id": lobby_id,
            "proposed_price": proposed_price, 
            "notes": notes, 
            "status": ProposalStatus.voting
        })
        
        await self.db.lobby.update(
            where={"id": lobby_id},
            data={"status": LobbyStatus.deal_pending}
        )
        return proposal

    async def vote_on_proposal(self, proposal_id: int, farmer_id: int, agree: bool):
        await self.vote_repo.create({"proposal_id": proposal_id, "farmer_id": farmer_id, "agree": agree})
        
        proposal = await self.db.proposal.find_unique(where={"id": proposal_id})
        if not proposal:
            raise ValueError("Proposal not found")
            
        total_members = await self.db.contribution.count(where={"lobby_id": proposal.lobby_id})
        total_agreed = await self.db.proposalvote.count(where={
            "proposal_id": proposal_id, 
            "agree": True
        })

        if total_agreed > (total_members / 2):
            await self.accept_proposal(proposal_id)
        return {"agreed": total_agreed, "total": total_members}

    async def veto_proposal(self, proposal_id: int, leader_id: int):
        proposal = await self.db.proposal.find_unique(where={"id": proposal_id})
        if not proposal:
            raise ValueError("Proposal not found")
            
        lobby = await self.db.lobby.find_unique(where={"id": proposal.lobby_id})
        
        if not lobby or lobby.leader_id != leader_id:
            raise ValueError("Only the Lobby Leader can veto a proposal")

        # 2. Veto the deal
        updated_proposal = await self.db.proposal.update(
            where={"id": proposal_id},
            data={"status": ProposalStatus.vetoed}
        )
        await self.db.lobby.update(
            where={"id": proposal.lobby_id},
            data={"status": LobbyStatus.ready}
        )
        return updated_proposal

    async def rate_order(self, order_id: int, rating: int, feedback: str = ""):
        order = await self.db.order.find_unique(where={"id": order_id})
        if not order: raise ValueError("Order not found")
        
        return await self.db.order.update(
            where={"id": order_id},
            data={
                "rating": rating,
                "feedback": feedback
            }
        )

    async def accept_proposal(self, proposal_id: int):
        proposal = await self.db.proposal.find_unique(where={"id": proposal_id})
        if not proposal: return
        
        lobby = await self.db.lobby.find_unique(where={"id": proposal.lobby_id})
        if not lobby: return

        await self.db.proposal.update(
            where={"id": proposal_id},
            data={"status": ProposalStatus.accepted}
        )
        await self.db.lobby.update(
            where={"id": proposal.lobby_id},
            data={"status": LobbyStatus.closed}
        )
        
        if lobby.request_id:
            await self.db.marketrequest.update(
                where={"id": lobby.request_id},
                data={"status": "completed"} # Using string literal for RequestStatus if not explicitly imported
            )

        await self.db.order.create(data={
            "proposal_id": proposal.id, 
            "customer_id": proposal.customer_id,
            "total_amount": proposal.proposed_price, 
            "status": OrderStatus.created
        })

    async def get_active_market_requests(self) -> List[Any]:
        return await self.db.marketrequest.find_many(
            where={"status": "pending"},
            include={"lobby": {"include": {"contributions": True}}}
        )

    async def get_customer_requests(self, customer_id: int) -> List[Any]:
        return await self.db.marketrequest.find_many(
            where={"customer_id": customer_id},
            include={"lobby": {"include": {"contributions": True}}}
        )

    async def get_lobby_proposals(self, lobby_id: int) -> List[Any]:
        return await self.db.proposal.find_many(
            where={"lobby_id": lobby_id},
            include={"votes": True}
        )

    async def confirm_request(self, customer_id: int, request_id: int) -> Any:
        """Customer confirms a ready lobby — creates order from combined farmer contributions."""
        request = await self.db.marketrequest.find_unique(
            where={"id": request_id},
            include={"lobby": {"include": {"contributions": True}}}
        )
        if not request:
            raise ValueError("Request not found")
        if request.customer_id != customer_id:
            raise ValueError("Not your request")
        if not request.lobby:
            raise ValueError("No lobby associated with this request")
        if request.lobby.status != LobbyStatus.ready:
            raise ValueError("Lobby is not ready for confirmation")

        # Calculate total from contributions
        total_amount = sum(
            c.quantity * c.price_bid for c in (request.lobby.contributions or [])
        )

        # Create a proposal (auto-accepted) to generate the order
        proposal = await self.proposal_repo.create({
            "customer_id": customer_id,
            "lobby_id": request.lobby.id,
            "proposed_price": total_amount,
            "notes": "Auto-confirmed by customer",
            "status": ProposalStatus.accepted
        })

        # Close lobby and complete request
        await self.db.lobby.update(
            where={"id": request.lobby.id},
            data={"status": LobbyStatus.closed}
        )
        await self.db.marketrequest.update(
            where={"id": request_id},
            data={"status": "completed"}
        )

        # Create order
        order = await self.db.order.create(data={
            "proposal_id": proposal.id,
            "customer_id": customer_id,
            "total_amount": total_amount,
            "status": OrderStatus.created
        })

        # Mark contributed inventory as sold
        for contribution in (request.lobby.contributions or []):
            await self.db.inventory.update_many(
                where={
                    "farmer_id": contribution.farmer_id,
                    "commodity": request.commodity,
                    "status": "available"
                },
                data={"status": "sold"}
            )

        return order

    async def get_customer_orders(self, customer_id: int) -> List[Any]:
        """Get all orders for a customer with full proposal/lobby/contribution details."""
        return await self.db.order.find_many(
            where={"customer_id": customer_id},
            include={
                "proposal": {
                    "include": {
                        "lobby": {
                            "include": {
                                "contributions": {
                                    "include": {"farmer": True}
                                }
                            }
                        }
                    }
                }
            },
            order={"created_at": "desc"}
        )

    async def pay_order(self, customer_id: int, order_id: int, payment_method: str = "upi") -> Any:
        """Simulate payment for an order."""
        order = await self.db.order.find_unique(where={"id": order_id})
        if not order:
            raise ValueError("Order not found")
        if order.customer_id != customer_id:
            raise ValueError("Not your order")
        if order.status != OrderStatus.created:
            raise ValueError("Order is not in a payable state")

        return await self.db.order.update(
            where={"id": order_id},
            data={"status": OrderStatus.paid}
        )

    async def update_order_status(self, order_id: int, new_status: str) -> Any:
        """Update order status (shipped, delivered, cancelled)."""
        order = await self.db.order.find_unique(where={"id": order_id})
        if not order:
            raise ValueError("Order not found")

        valid_transitions = {
            "created": ["paid", "cancelled"],
            "paid": ["packed", "cancelled"],
            "packed": ["dispatched"],
            "dispatched": ["shipped"],
            "shipped": ["delivered"],
            "delivered": [],
            "cancelled": []
        }

        if new_status not in valid_transitions.get(order.status, []):
            raise ValueError(f"Cannot transition from {order.status} to {new_status}")

        return await self.db.order.update(
            where={"id": order_id},
            data={"status": new_status}
        )

    async def delete_request(self, customer_id: int, request_id: int) -> None:
        """Customer deletes their own pending sourcing request."""
        request = await self.db.marketrequest.find_unique(
            where={"id": request_id},
            include={"lobby": True}
        )
        if not request:
            raise ValueError("Request not found")
        if request.customer_id != customer_id:
            raise ValueError("Not your request")
        if request.status != "pending":
            raise ValueError("Only pending requests can be deleted")
        # Delete associated lobby first (cascade cleanup of FK-constrained records)
        if request.lobby:
            lobby_id = request.lobby.id
            # 1. Delete messages
            await self.db.lobbymessage.delete_many(where={"lobby_id": lobby_id})
            # 2. Delete proposal votes then proposals
            proposals = await self.db.proposal.find_many(where={"lobby_id": lobby_id})
            for p in proposals:
                await self.db.proposalvote.delete_many(where={"proposal_id": p.id})
            await self.db.proposal.delete_many(where={"lobby_id": lobby_id})
            # 3. Delete contributions
            await self.db.contribution.delete_many(where={"lobby_id": lobby_id})
            # 4. Delete lobby itself
            await self.db.lobby.delete(where={"id": lobby_id})
        await self.db.marketrequest.delete(where={"id": request_id})

    async def get_farmer_orders(self, farmer_id: int) -> List[Any]:
        """Return all orders where the lobby contains a contribution by this farmer."""
        return await self.db.order.find_many(
            where={
                "proposal": {
                    "lobby": {
                        "contributions": {
                            "some": {"farmer_id": farmer_id}
                        }
                    }
                }
            },
            include={
                "proposal": {
                    "include": {
                        "lobby": {
                            "include": {
                                "contributions": {
                                    "include": {"farmer": True}
                                }
                            }
                        }
                    }
                }
            },
            order={"created_at": "desc"}
        )

    async def track_order(self, farmer_id: int, order_id: int, new_status: str) -> Any:
        """Farmer updates tracking status for an order linked to their contribution."""
        valid_tracking = ["packed", "dispatched", "shipped", "delivered"]
        if new_status not in valid_tracking:
            raise ValueError(f"Invalid tracking status: {new_status}")

        order = await self.db.order.find_unique(
            where={"id": order_id},
            include={
                "proposal": {
                    "include": {
                        "lobby": {
                            "include": {"contributions": True}
                        }
                    }
                }
            }
        )
        if not order:
            raise ValueError("Order not found")

        contributions = order.proposal.lobby.contributions if order.proposal and order.proposal.lobby else []
        farmer_ids = [c.farmer_id for c in contributions]
        if farmer_id not in farmer_ids:
            raise ValueError("You are not a contributor to this order")

        valid_transitions = {
            "created": [],
            "paid": ["packed"],
            "packed": ["dispatched"],
            "dispatched": ["shipped"],
            "shipped": ["delivered"],
            "delivered": [],
            "cancelled": []
        }
        if new_status not in valid_transitions.get(order.status, []):
            raise ValueError(f"Cannot move from {order.status} to {new_status}")

        return await self.db.order.update(
            where={"id": order_id},
            data={"status": new_status}
        )

    async def get_request_with_offers(self, customer_id: int, request_id: int) -> Any:
        """Returns a request with its lobby and all farmer contributions."""
        request = await self.db.marketrequest.find_unique(
            where={"id": request_id},
            include={
                "lobby": {
                    "include": {
                        "contributions": {
                            "include": {"farmer": True}
                        }
                    }
                }
            }
        )
        if not request:
            raise ValueError("Request not found")
        if request.customer_id != customer_id:
            raise ValueError("Not your request")
        return request
