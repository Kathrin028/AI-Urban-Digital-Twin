from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from datetime import datetime
from bson import ObjectId
import uuid
from pathlib import Path
import os
from app.database.connection import db_instance
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintUpdate, DuplicateCheckRequest
from app.core.dependencies import get_current_user, get_current_active_admin

router = APIRouter()

from app.services.priority_explanation import generate_priority_factors
from app.services.recommendations import get_recommended_action
from app.services.duplicate_detection import check_similar_complaints

def calculate_dynamic_priority(complaint: dict):
    count = complaint.get("related_report_count", 1)
    cat = complaint.get("category", "")
    
    priority = "Low"
    if count == 1:
        priority = "Low" if cat not in ["Road Damage", "Drainage", "Water Leakage"] else "Medium"
    elif count >= 2 and count <= 3:
        priority = "Medium" if cat not in ["Road Damage", "Drainage"] else "High"
    elif count >= 4 and count <= 7:
        priority = "High" if cat not in ["Road Damage"] else "Critical"
    else:
        priority = "Critical"
        
    est = "5-7 Days"
    if priority == "Low": est = "5-7 Days"
    elif priority == "Medium": est = "3-5 Days"
    elif priority == "High": est = "2-3 Days"
    elif priority == "Critical": est = "1-2 Days"
    
    return priority, est

def serialize_complaint(complaint: dict) -> dict:
    if not complaint:
        return None
    complaint["id"] = str(complaint["_id"])
    
    # Defaults for legacy docs
    if "is_primary" not in complaint:
        complaint["is_primary"] = True
    if "is_duplicate" not in complaint:
        complaint["is_duplicate"] = False
    if "duplicate_of" not in complaint:
        complaint["duplicate_of"] = None
    if "related_report_count" not in complaint:
        complaint["related_report_count"] = 1
    if "evidence_verification_status" not in complaint:
        complaint["evidence_verification_status"] = "NOT_ANALYZED"
    
    priority, est = calculate_dynamic_priority(complaint)
    complaint["priority"] = priority
    complaint["estimated_resolution"] = est
    
    factors = generate_priority_factors(complaint)
    recommendation = get_recommended_action(complaint)
    
    ai_pred = complaint.get("ai_prediction")
    if ai_pred:
        ai_pred["priority_factors"] = factors
    ai_pred_old = complaint.get("aiPrediction")
    if ai_pred_old:
        ai_pred_old["priority_factors"] = factors
        
    complaint["recommended_action"] = recommendation
        
    return complaint

@router.post("/check-duplicate")
async def check_duplicate(request: DuplicateCheckRequest, current_user: dict = Depends(get_current_user)):
    return await check_similar_complaints(
        category=request.category,
        lat=request.latitude,
        lng=request.longitude,
        db=db_instance.db
    )

from app.ml.detection.detector import detector
import time

@router.post("/analyze-image")
async def analyze_complaint_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported image format")
        
    file.file.seek(0, 2)
    if file.file.tell() > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")
    file.file.seek(0)
    
    ext = file.content_type.split("/")[-1]
    if ext == "jpeg": ext = "jpg"
    safe_filename = f"temp_{uuid.uuid4().hex}.{ext}"
    
    uploads_dir = Path(__file__).parent.parent.parent / "uploads" / "temp"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    file_path = uploads_dir / safe_filename
    
    with open(file_path, "wb") as buffer:
        while chunk := file.file.read(8192):
            buffer.write(chunk)
            
    try:
        t0 = time.time()
        prediction_result = detector.predict(str(file_path))
        if prediction_result.get("available"):
            ai_prediction = {
                "available": True,
                "category": prediction_result.get("category"),
                "confidence": prediction_result.get("confidence", 0),
                "inference_time_ms": round((time.time() - t0) * 1000),
                "bounding_boxes": prediction_result.get("bounding_boxes", []),
                "model_name": prediction_result.get("model_name", "YOLOv8n"),
                "model_version": prediction_result.get("model_version", "1.0"),
                "analyzed_at": prediction_result.get("analyzed_at")
            }
            
            # Predict priority based on category
            priority_features = {
                "category": ai_prediction["category"] if ai_prediction["category"] else "Unknown",
                "yolo_confidence": ai_prediction["confidence"],
                "bounding_box_count": len(prediction_result.get("bounding_boxes", [])),
                "complaint_age_days": 0,
                "repeat_complaint_count": 0,
                "image_exists": 1
            }
            from app.ml.priority.predictor import priority_predictor
            pri_result = priority_predictor.predict(priority_features)
            if pri_result.get("available"):
                ai_prediction["priority"] = pri_result.get("priority")
                ai_prediction["priority_confidence"] = pri_result.get("priority_confidence")
                ai_prediction["model_name"] = f"{ai_prediction['model_name']} + RandomForest"
                ai_prediction["model_version"] = "1.1"
                
            return ai_prediction
        else:
            return {"available": False, "reason": prediction_result.get("reason", "model_not_loaded")}
    finally:
        if file_path.exists():
            os.remove(file_path)

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(complaint: ComplaintCreate, current_user: dict = Depends(get_current_user)):
    complaint_data = complaint.model_dump()
    complaint_data["user_id"] = str(current_user["id"])
    now = datetime.utcnow()
    complaint_data["status"] = "Pending"
    complaint_data["created_at"] = now
    complaint_data["updated_at"] = now
    complaint_data["status_history"] = [
        {
            "status": "Pending",
            "changed_at": now.isoformat(),
            "changed_by": str(current_user["id"]),
            "changed_by_role": "citizen"
        }
    ]
    
    # Check for duplicates before creating
    try:
        lat = float(complaint.location.latitude)
        lng = float(complaint.location.longitude)
        dup_check = await check_similar_complaints(
            category=complaint.category,
            lat=lat,
            lng=lng,
            db=db_instance.db
        )
        primary_id = dup_check.get("primary_complaint_id")
    except Exception:
        primary_id = None
        
    if primary_id:
        complaint_data["is_primary"] = False
        complaint_data["is_duplicate"] = True
        complaint_data["duplicate_of"] = primary_id
        complaint_data["related_report_count"] = 1
        
        # update primary complaint atomically
        from bson import ObjectId
        if ObjectId.is_valid(primary_id):
            await db_instance.db.complaints.update_one(
                {"_id": ObjectId(primary_id)},
                {"$inc": {"related_report_count": 1}}
            )
    else:
        complaint_data["is_primary"] = True
        complaint_data["is_duplicate"] = False
        complaint_data["duplicate_of"] = None
        complaint_data["related_report_count"] = 1
    
    result = await db_instance.db.complaints.insert_one(complaint_data)
    created_complaint = await db_instance.db.complaints.find_one({"_id": result.inserted_id})
    return serialize_complaint(created_complaint)

@router.get("/my", response_model=List[ComplaintResponse])
async def get_my_complaints(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["id"])
    cursor = db_instance.db.complaints.find({"user_id": user_id}).sort("created_at", -1)
    complaints = await cursor.to_list(length=1000)
    return [serialize_complaint(c) for c in complaints]

@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(complaint_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID format")
    
    complaint = await db_instance.db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if current_user["role"] != "admin" and complaint["user_id"] != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Not authorized to view this complaint")
        
    return serialize_complaint(complaint)

from typing import Optional
import re

@router.get("/", response_model=List[ComplaintResponse])
async def get_all_complaints(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    primary_only: Optional[bool] = False,
    duplicate_of: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if primary_only:
        query["is_primary"] = {"$ne": False}
    if duplicate_of:
        query["duplicate_of"] = duplicate_of
    if priority:
        # Since priority might be in 'aiPrediction.priority' or 'priority', we can check both
        query["$or"] = [
            {"priority": priority},
            {"aiPrediction.priority": priority}
        ]
        
    if search:
        # safely escape search term for regex
        escaped_search = re.escape(search)
        regex_pattern = {"$regex": escaped_search, "$options": "i"}
        
        search_conditions = [
            {"category": regex_pattern},
            {"description": regex_pattern},
            {"user_id": regex_pattern}
        ]
        
        if ObjectId.is_valid(search):
            search_conditions.append({"_id": ObjectId(search)})
            
        if "$or" in query:
            query = {"$and": [query, {"$or": search_conditions}]}
        else:
            query["$or"] = search_conditions

    cursor = db_instance.db.complaints.find(query).sort("created_at", -1)
    complaints = await cursor.to_list(length=10000)
    return [serialize_complaint(c) for c in complaints]

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(complaint_id: str, update_data: ComplaintUpdate, current_admin: dict = Depends(get_current_active_admin)):
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID format")
        
    valid_statuses = ["Pending", "In Progress", "Resolved"]
    if update_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    complaint = await db_instance.db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    current_status = complaint.get("status", "Pending")
    new_status = update_data.status
    
    if current_status == new_status:
        return serialize_complaint(complaint)
        
    # Transition validation
    valid_transitions = {
        "Pending": ["In Progress", "Resolved"],
        "In Progress": ["Resolved"]
    }
    
    if current_status not in valid_transitions or new_status not in valid_transitions[current_status]:
        raise HTTPException(status_code=400, detail=f"Invalid transition from {current_status} to {new_status}")
        
    now = datetime.utcnow()
    new_history_entry = {
        "status": new_status,
        "changed_at": now.isoformat(),
        "changed_by": str(current_admin["id"]),
        "changed_by_role": "admin"
    }
    
    result = await db_instance.db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        {
            "$set": {"status": new_status, "updated_at": now},
            "$push": {"status_history": new_history_entry}
        }
    )
    
    updated_complaint = await db_instance.db.complaints.find_one({"_id": ObjectId(complaint_id)})
    return serialize_complaint(updated_complaint)

from app.ml.detection.detector import detector
from app.ml.priority.predictor import priority_predictor
import time

@router.post("/{complaint_id}/image", response_model=ComplaintResponse)
async def upload_complaint_image(complaint_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID format")
        
    complaint = await db_instance.db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if current_user["role"] != "admin" and complaint["user_id"] != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Not authorized to update this complaint's evidence")

    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported image format. Use JPEG, PNG, or WEBP")

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Max size is 5MB")

    ext = file.content_type.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"

    safe_filename = f"{complaint_id}_{uuid.uuid4().hex}.{ext}"
    uploads_dir = Path(__file__).parent.parent.parent / "uploads" / "complaints"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = uploads_dir / safe_filename
    
    with open(file_path, "wb") as buffer:
        while chunk := file.file.read(8192):
            buffer.write(chunk)
            
    SUPPORTED_AI_CATEGORIES = ["garbage", "pothole", "road damage"]
    citizen_cat = complaint.get("category", "").strip().lower()
    
    if citizen_cat not in SUPPORTED_AI_CATEGORIES:
        ai_prediction = {
            "available": False,
            "reason": "AI image verification is not currently available for this category"
        }
        evidence_status = "UNVERIFIED"
    else:
        # Run AI inference
        ai_prediction = None
        try:
            t0 = time.time()
            prediction_result = detector.predict(str(file_path))
            
            yolo_time = prediction_result.get("inference_time_ms", 0)
            
            if prediction_result.get("available"):
                ai_prediction = {
                    "available": True,
                    "category": prediction_result.get("category"),
                    "confidence": prediction_result.get("confidence", 0),
                    "bounding_boxes": prediction_result.get("bounding_boxes", []),
                    "model_name": prediction_result.get("model_name", "YOLOv8n"),
                    "model_version": prediction_result.get("model_version", "1.0"),
                    "inference_time_ms": yolo_time,
                    "analyzed_at": prediction_result.get("analyzed_at")
                }
            else:
                ai_prediction = {
                    "available": False,
                    "reason": prediction_result.get("reason", "model_not_loaded")
                }
                
            # Priority Prediction
            if ai_prediction:
                age_days = (datetime.utcnow() - complaint.get("created_at", datetime.utcnow())).days
                if age_days < 0: age_days = 0
                    
                priority_features = {
                    "category": ai_prediction.get("category", "Unknown") if ai_prediction.get("available") else complaint.get("category", "Unknown"),
                    "yolo_confidence": ai_prediction.get("confidence", 0.0) if ai_prediction.get("available") else 0.0,
                    "bounding_box_count": len(ai_prediction.get("bounding_boxes", [])) if ai_prediction.get("available") else 0,
                    "complaint_age_days": age_days,
                    "repeat_complaint_count": 0,
                    "image_exists": 1
                }
                
                pri_result = priority_predictor.predict(priority_features)
                if pri_result.get("available"):
                    ai_prediction["priority"] = pri_result.get("priority")
                    ai_prediction["priority_confidence"] = pri_result.get("priority_confidence")
                    if ai_prediction.get("available"):
                        ai_prediction["model_name"] = f"{ai_prediction['model_name']} + RandomForest"
                        ai_prediction["model_version"] = "1.1"
                        
            total_time_ms = round((time.time() - t0) * 1000)
            if ai_prediction and ai_prediction.get("available"):
                ai_prediction["inference_time_ms"] = total_time_ms
                
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"AI inference error: {e}")
            ai_prediction = {
                "available": False,
                "reason": "AI analysis failed. The complaint was submitted, but image verification could not be completed."
            }
                
        evidence_status = "ANALYSIS_FAILED" if (ai_prediction and not ai_prediction.get("available") and ai_prediction.get("reason") != "model_not_loaded") else "NOT_ANALYZED"
        
        if ai_prediction and ai_prediction.get("available"):
            yolo_cat = ai_prediction.get("category")
            conf = ai_prediction.get("confidence", 0)
            
            if not yolo_cat or conf <= 0:
                evidence_status = "INSUFFICIENT_VISUAL_EVIDENCE"
            else:
                yolo_normalized = str(yolo_cat).strip().lower()
                if citizen_cat == yolo_normalized:
                    evidence_status = "VERIFIED"
                else:
                    evidence_status = "CATEGORY_MISMATCH"

                
    image_url = f"/uploads/complaints/{safe_filename}"
    image_metadata = {
        "original_filename": file.filename,
        "stored_filename": safe_filename,
        "content_type": file.content_type,
        "size": file_size
    }
    
    update_doc = {
        "$set": {
            "image_url": image_url,
            "image_metadata": image_metadata,
            "evidence_verification_status": evidence_status,
            "updated_at": datetime.utcnow()
        }
    }
    
    if ai_prediction is not None:
        update_doc["$set"]["ai_prediction"] = ai_prediction
        # Keep old field for backward compatibility
        update_doc["$set"]["aiPrediction"] = ai_prediction
    
    result = await db_instance.db.complaints.update_one(
        {"_id": ObjectId(complaint_id)},
        update_doc
    )
    
    updated_complaint = await db_instance.db.complaints.find_one({"_id": ObjectId(complaint_id)})
    return serialize_complaint(updated_complaint)