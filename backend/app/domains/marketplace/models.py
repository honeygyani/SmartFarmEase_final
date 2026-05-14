import enum


class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ProposalStatus(str, enum.Enum):
    PENDING = "pending"
    VOTING = "voting"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    VETOED = "vetoed"
    CONVERTED = "converted"


class OrderStatus(str, enum.Enum):
    CREATED = "created"
    PAID = "paid"
    PACKED = "packed"
    DISPATCHED = "dispatched"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
