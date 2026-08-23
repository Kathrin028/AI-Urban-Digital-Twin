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
    
    return user_dict
