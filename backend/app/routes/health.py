from fastapi import APIRouter
from app.database.connection import get_database

router = APIRouter()

@router.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "message": "UrbanMind AI API is running"
    }

@router.get("/health/db", tags=["health"])
async def database_health_check():
    db = get_database()
    if db is None:
        return {
            "status": "error",
            "database": "disconnected",
            "message": "Database client is not initialized"
        }
    try:
        await db.command("ping")
        return {
            "status": "ok",
            "database": "connected",
            "database_name": db.name
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "message": str(e)
        }
