from app.database.connection import db_instance
from datetime import datetime

async def seed_departments():
    default_departments = [
        {"name": "Roads & Infrastructure", "description": "Handles road repairs, potholes, and infrastructure.", "is_active": True},
        {"name": "Water Supply", "description": "Handles water leakage and supply issues.", "is_active": True},
        {"name": "Sanitation", "description": "Handles drainage and sanitation issues.", "is_active": True},
        {"name": "Waste Management", "description": "Handles garbage collection and street cleaning.", "is_active": True},
        {"name": "Electricity", "description": "Handles streetlights and power supply issues.", "is_active": True}
    ]
    
    for dept in default_departments:
        # Upsert by name
        existing = await db_instance.db.departments.find_one({"name": {"$regex": f"^{dept['name']}$", "$options": "i"}})
        if not existing:
            dept["created_at"] = datetime.utcnow()
            dept["updated_at"] = datetime.utcnow()
            await db_instance.db.departments.insert_one(dept)

async def seed_demo_users(force: bool = False):
    from app.core.config import settings
    # Only seed demo accounts in development/testing or when explicitly configured
    is_dev = settings.app_env.lower() in ["development", "dev", "local", "testing", "test"]
    should_seed = force or is_dev or getattr(settings, "seed_demo_data", False)

    if not should_seed:
        return

    from app.core.security import hash_password
    demo_users = [
        {
            "name": "City Official",
            "email": "admin@urbanmind.ai",
            "password": "AdminSecurePassword123!",
            "phone": "0000000000",
            "city": "Admin City",
            "role": "admin"
        },
        {
            "name": "Demo Citizen",
            "email": "demo@urbanmind.ai",
            "password": "password123",
            "phone": "9876543210",
            "city": "Coimbatore",
            "role": "citizen"
        },
        {
            "name": "Department Official",
            "email": "dept@urbanmind.ai",
            "password": "password123",
            "phone": "9876543211",
            "city": "Coimbatore",
            "role": "department",
            "department": "Sanitation"
        },
        {
            "name": "Waste Management Team",
            "email": "waste@urbanmind.ai",
            "password": "password123",
            "phone": "9876543212",
            "city": "Coimbatore",
            "role": "department",
            "department": "Waste Management"
        }
    ]
    for u in demo_users:
        existing = await db_instance.db.users.find_one({"email": u["email"]})
        if not existing:
            doc = {
                "name": u["name"],
                "email": u["email"],
                "password_hash": hash_password(u["password"]),
                "phone": u["phone"],
                "city": u["city"],
                "role": u["role"],
                "department": u.get("department"),
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db_instance.db.users.insert_one(doc)
        else:
            # Never overwrite existing passwords in production.
            # Only backfill missing fields (such as department or timestamps) if they are absent.
            update_fields = {}
            if u.get("department") and not existing.get("department"):
                update_fields["department"] = u["department"]
            if "created_at" not in existing:
                update_fields["created_at"] = datetime.utcnow()
            if "updated_at" not in existing:
                update_fields["updated_at"] = datetime.utcnow()
            if update_fields:
                await db_instance.db.users.update_one(
                    {"_id": existing["_id"]},
                    {"$set": update_fields}
                )
