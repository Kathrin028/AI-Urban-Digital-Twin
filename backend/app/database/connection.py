import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    try:
        logger.info("Connecting to MongoDB...")
        db_instance.client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
        db_instance.db = db_instance.client[settings.mongodb_db_name]
        # Ping the database to verify connection
        await db_instance.db.command("ping")
        logger.info("Successfully connected to MongoDB.")
        
        # Initialize collections and indexes
        from app.models.user import user_indexes
        from app.models.complaint import complaint_indexes
        await db_instance.db.users.create_indexes(user_indexes)
        
        # Create complaints indexes
        await db_instance.db.complaints.create_indexes(complaint_indexes)
        
        import logging
        logging.getLogger(__name__).info("Connected to MongoDB successfully!")
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        # Not raising here allows the app to start even if DB is down initially,
        # but the instructions say "A database connection failure should produce a clear development error rather than silently pretending that the database is connected."
        # So we will raise the exception.
        raise

async def close_mongo_connection():
    if db_instance.client:
        logger.info("Closing MongoDB connection...")
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_instance.db
