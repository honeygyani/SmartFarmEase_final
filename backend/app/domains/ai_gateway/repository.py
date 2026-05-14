from app.db.repository import BaseRepository
from prisma import Prisma

class HealthLogRepository(BaseRepository):
    def __init__(self, db: Prisma):
        super().__init__("healthtrendlog", db)
