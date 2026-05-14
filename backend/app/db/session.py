from prisma import Prisma

db = Prisma()

async def get_db():
    if not db.is_connected():
        await db.connect()
    return db

# For compatibility during migration
SessionLocal = get_db
