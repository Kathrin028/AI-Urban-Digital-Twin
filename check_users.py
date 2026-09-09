import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient('mongodb://127.0.0.1:27017')
    db = client['urbanmind_ai']
    users = await db.users.find().to_list(length=100)
    for u in users:
        print(f"Email: {u.get('email')}, Role: {u.get('role')}")

asyncio.run(run())
