from pymongo import IndexModel, ASCENDING

# Definition of indexes for the users collection
user_indexes = [
    IndexModel([("email", ASCENDING)], unique=True)
]

def map_user_db_to_schema(user_dict: dict) -> dict:
    """
    Maps a MongoDB user document to a dictionary that matches UserResponse schema.
    """
    if not user_dict:
        return None
    
    # MongoDB _id is an ObjectId, convert to string
    user_dict["id"] = str(user_dict.pop("_id"))
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    if "created_at" not in user_dict or not user_dict["created_at"]:
        user_dict["created_at"] = now
    if "updated_at" not in user_dict or not user_dict["updated_at"]:
        user_dict["updated_at"] = now
    if "is_active" not in user_dict:
        user_dict["is_active"] = True
    
    return user_dict
