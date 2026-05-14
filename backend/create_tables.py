import asyncio
import os
import sys

# Add the current directory to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.db.session import db

async def init_db():
    print("Connecting to Neon PostgreSQL database via Prisma...")
    try:
        await db.connect()
        print("✅ Prisma connected successfully!")
        
        # In Prisma, we usually use 'prisma db push' or 'prisma migrate'
        # But we can also check connection here.
        
        print("Database is ready.")
        await db.disconnect()
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        print("Tip: Check your DATABASE_URL in .env and ensure your Neon server is active.")

if __name__ == "__main__":
    asyncio.run(init_db())
