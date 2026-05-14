"""
SmartFarmEase Database Seed Script
Creates test users and sample inventory data in the Neon PostgreSQL database.
"""

import asyncio
from prisma import Prisma
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    db = Prisma()
    await db.connect()

    print("[*] Seeding database...")

    # -- Create Test Users --
    users_data = [
        {
            "email": "admin@smartfarmease.com",
            "hashed_password": pwd_context.hash("admin1234"),
            "full_name": "Admin User",
            "role": "admin",
        },
        {
            "email": "farmer@smartfarmease.com",
            "hashed_password": pwd_context.hash("farmer1234"),
            "full_name": "Ravi Kumar",
            "role": "farmer",
        },
        {
            "email": "customer@smartfarmease.com",
            "hashed_password": pwd_context.hash("customer1234"),
            "full_name": "Priya Sharma",
            "role": "customer",
        },
    ]

    created_users = []
    for u in users_data:
        existing = await db.user.find_unique(where={"email": u["email"]})
        if existing:
            print(f"  [skip] User {u['email']} already exists, skipping.")
            created_users.append(existing)
        else:
            user = await db.user.create(data=u)
            print(f"  [ok] Created {user.role}: {user.email}")
            created_users.append(user)

    await db.disconnect()
    print("\n[done] Seed complete!")
    print("\nTest Credentials:")
    print("  Admin:    admin@smartfarmease.com / admin1234")
    print("  Farmer:   farmer@smartfarmease.com / farmer1234")
    print("  Customer: customer@smartfarmease.com / customer1234")


if __name__ == "__main__":
    asyncio.run(seed())
