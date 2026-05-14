from sqlalchemy import String, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class SystemEvent(Base):
    __tablename__ = "events"

    event_type: Mapped[str] = mapped_column(String(100), index=True) # e.g., 'ORDER_CREATED', 'AI_PREDICTION'
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON) # Structured JSONB log
    description: Mapped[str] = mapped_column(String(255), nullable=True)
