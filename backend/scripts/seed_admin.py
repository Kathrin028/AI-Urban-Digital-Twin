import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import connect_to_mongo, close_mongo_connection, get_database
from app.core.security import hash_password
from datetime import datetime

async def seed_admin():
    print("Connecting to database...")
    await connect_to_mongo()
    
    db = get_database()
    
    admin_email = "admin@urbanmind.ai"
    
    print(f"Checking if admin account ({admin_email}) exists...")
    existing_admin = await db.users.find_one({"email": admin_email})
    
    if existing_admin:
        print("Admin account already exists. Ensuring password and active status are set...")
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {
                "password_hash": hash_password("AdminSecurePassword123!"),
                "is_active": True,
                "role": "admin"
            }}
        )
        print("Admin account credentials refreshed.")
        print(f"Email: {admin_email}")
        print("Password: AdminSecurePassword123!")
    else:
        print("Creating admin account...")
        new_admin = {
            "name": "City Official",
            "email": admin_email,
            "password_hash": hash_password("AdminSecurePassword123!"),
            "phone": "0000000000",
            "city": "Admin City",
            "role": "admin",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.users.insert_one(new_admin)
        print("Admin account created successfully.")
        print(f"Email: {admin_email}")
        print("Password: AdminSecurePassword123!")
        
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(seed_admin())
