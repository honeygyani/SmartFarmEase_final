from typing import Any, Dict, Optional
from prisma import Prisma
from app.db.repository import BaseRepository

class EventLogService:
    def __init__(self, db: Prisma):
        self.repo = BaseRepository("systemevent", db)

    async def log_event(
        self, 
        event_type: str, 
        payload: Dict[str, Any], 
        user_id: Optional[int] = None, 
        description: Optional[str] = None
    ):
        event_data = {
            "event_type": event_type,
            "user_id": user_id,
            "payload": payload,
            "description": description
        }
        await self.repo.create(event_data)
