import enum


class LobbyStatus(str, enum.Enum):
    OPEN = "open"
    READY = "ready"
    DEAL_PENDING = "deal_pending"
    CLOSED = "closed"
