from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId
from app.database.connection import db_instance
from app.core.dependencies import get_current_active_admin
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
import pymongo

router = APIRouter()

def map_dept_to_schema(doc) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc

@router.get("/", response_model=List[DepartmentResponse])
async def get_all_departments(current_admin: dict = Depends(get_current_active_admin)):
    cursor = db_instance.db.departments.find({}).sort("name", pymongo.ASCENDING)
    departments = await cursor.to_list(length=None)
    return [map_dept_to_schema(d) for d in departments]

@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(dept_in: DepartmentCreate, current_admin: dict = Depends(get_current_active_admin)):
    name = dept_in.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Department name cannot be empty")
        
    existing = await db_instance.db.departments.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
        
    new_dept = {
        "name": name,
        "description": dept_in.description,
        "is_active": dept_in.is_active if dept_in.is_active is not None else True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db_instance.db.departments.insert_one(new_dept)
    new_dept["_id"] = result.inserted_id
    return map_dept_to_schema(new_dept)

@router.put("/{dept_id}", response_model=DepartmentResponse)
async def update_department(dept_id: str, dept_in: DepartmentUpdate, current_admin: dict = Depends(get_current_active_admin)):
    if not ObjectId.is_valid(dept_id):
        raise HTTPException(status_code=400, detail="Invalid department ID")
        
    obj_id = ObjectId(dept_id)
    dept = await db_instance.db.departments.find_one({"_id": obj_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    update_data = {}
    if dept_in.name is not None:
        name = dept_in.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Department name cannot be empty")
        existing = await db_instance.db.departments.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}, "_id": {"$ne": obj_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Department with this name already exists")
        update_data["name"] = name
        
    if dept_in.description is not None:
        update_data["description"] = dept_in.description
        
    if dept_in.is_active is not None:
        update_data["is_active"] = dept_in.is_active
        
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db_instance.db.departments.update_one({"_id": obj_id}, {"$set": update_data})
        
    updated_dept = await db_instance.db.departments.find_one({"_id": obj_id})
    return map_dept_to_schema(updated_dept)

@router.delete("/{dept_id}")
async def delete_department(dept_id: str, current_admin: dict = Depends(get_current_active_admin)):
    if not ObjectId.is_valid(dept_id):
        raise HTTPException(status_code=400, detail="Invalid department ID")
        
    obj_id = ObjectId(dept_id)
    dept = await db_instance.db.departments.find_one({"_id": obj_id})
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Soft delete / deactivate
    await db_instance.db.departments.update_one(
        {"_id": obj_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Department successfully deactivated"}
