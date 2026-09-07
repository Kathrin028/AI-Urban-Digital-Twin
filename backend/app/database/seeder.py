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
