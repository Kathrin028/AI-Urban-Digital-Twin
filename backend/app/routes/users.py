from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.database.connection import db_instance
from app.routes.auth import get_current_user
from bson import ObjectId
import os
import uuid
import shutil

router = APIRouter()

UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user = await db_instance.db.users.find_one({"_id": ObjectId(current_user["id"])}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["id"] = str(user["_id"])
    del user["_id"]
    return user

@router.patch("/profile")
async def update_profile(
    name: str = Form(None),
    phone: str = Form(None),
    profile_photo: UploadFile = File(None),
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    if name:
        update_data["name"] = name
    if phone:
        update_data["phone"] = phone
        
    if profile_photo:
        if profile_photo.content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise HTTPException(status_code=400, detail="Invalid image format. Only JPEG, PNG, WEBP allowed.")
            
        file_extension = profile_photo.filename.split('.')[-1]
        unique_filename = f"{current_user['id']}_{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save photo
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(profile_photo.file, buffer)
            
        update_data["profile_photo"] = f"/uploads/profiles/{unique_filename}"
        
    if update_data:
        await db_instance.db.users.update_one(
            {"_id": ObjectId(current_user["id"])},
            {"$set": update_data}
        )
        
    updated_user = await db_instance.db.users.find_one({"_id": ObjectId(current_user["id"])}, {"password": 0})
    updated_user["id"] = str(updated_user["_id"])
    del updated_user["_id"]
    
    return updated_user
