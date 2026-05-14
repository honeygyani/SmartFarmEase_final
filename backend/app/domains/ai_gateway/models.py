from sqlalchemy import String, Float, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class HealthTrendLog(Base):
    __tablename__ = "health_logs"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    service_type: Mapped[str] = mapped_column(String(50))  # e.g., 'disease', 'crop_rec'
    request_payload: Mapped[dict] = mapped_column(JSON)
    response_data: Mapped[dict] = mapped_column(JSON)
    latency_ms: Mapped[float] = mapped_column(Float)
    status_code: Mapped[int] = mapped_column(index=True)
