from datetime import datetime
from fastapi import HTTPException, status
from app.database.connection import get_database
from app.models.user import map_user_db_to_schema
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import hash_password, verify_password, create_access_token
import pymongo

async def register_citizen(user_data: UserRegister) -> dict:
    db = get_database()
    
    email = user_data.email.strip().lower()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    new_user = {
        "name": user_data.name,
        "email": email,
        "password_hash": hash_password(user_data.password),
        "phone": user_data.phone,
        "city": user_data.city,
        "role": user_data.role if user_data.role in ["citizen", "admin", "department"] else "citizen",
        "department": user_data.department,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    try:
        result = await db.users.insert_one(new_user)
        new_user["_id"] = result.inserted_id
        return map_user_db_to_schema(new_user)
    except pymongo.errors.DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

async def authenticate_user(login_data: UserLogin) -> dict:
    db = get_database()
    email = login_data.email.strip().lower()
    
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    user_dict = map_user_db_to_schema(user)
    
    access_token = create_access_token(data={"sub": user_dict["id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_dict
    }

async def get_user_by_id(user_id: str) -> dict:
    from bson.objectid import ObjectId
    from bson.errors import InvalidId
    
    try:
        obj_id = ObjectId(user_id)
    except InvalidId:
        return None
        
    db = get_database()
    user = await db.users.find_one({"_id": obj_id})
    if user:
        return map_user_db_to_schema(user)
    return None
