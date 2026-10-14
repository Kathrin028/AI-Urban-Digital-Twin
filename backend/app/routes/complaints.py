from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from datetime import datetime, timezone
from bson import ObjectId
import uuid
from pathlib import Path
import os
from app.database.connection import db_instance
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintUpdate, ComplaintAssign, DuplicateCheckRequest, ProgressNoteCreate
from app.core.dependencies import get_current_user, get_current_active_admin, get_current_department_user

router = APIRouter()

import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

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

async def get_user_department_identifiers(current_user: dict):
    """
    Returns a tuple of (dept_id_str, dept_name, valid_identifiers_set, query_condition)
    for a department user. Handles case-insensitive names, ObjectIds, IDs, and whitespace.
    """
    import re
    dept_val = str(current_user.get("department") or "").strip()
    if not dept_val:
        return None, None, set(), {"assigned_department": "not-found"}

    # Try lookup by ObjectId if dept_val is a valid ObjectId
    dept_doc = None
    if ObjectId.is_valid(dept_val):
        dept_doc = await db_instance.db.departments.find_one({"_id": ObjectId(dept_val)})

    # If not found by ID, try case-insensitive regex by name or code
    if not dept_doc:
        dept_doc = await db_instance.db.departments.find_one({
            "$or": [
                {"name": {"$regex": f"^{re.escape(dept_val)}$", "$options": "i"}},
                {"code": {"$regex": f"^{re.escape(dept_val)}$", "$options": "i"}}
            ]
        })

    valid_identifiers = set()
    valid_identifiers.add(dept_val)
    valid_identifiers.add(dept_val.lower())

    dept_id_str = None
    dept_name = None
    or_clauses = [
        {"assigned_department": dept_val},
        {"assigned_department": {"$regex": f"^{re.escape(dept_val)}$", "$options": "i"}},
        {"assigned_department_name": {"$regex": f"^{re.escape(dept_val)}$", "$options": "i"}}
    ]

    if dept_doc:
        dept_id_str = str(dept_doc["_id"])
        dept_name = dept_doc.get("name", dept_val)
        valid_identifiers.add(dept_id_str)
        valid_identifiers.add(dept_name)
        valid_identifiers.add(dept_name.lower())

        or_clauses.extend([
            {"assigned_department": dept_id_str},
            {"assigned_department": dept_doc["_id"]},
            {"assigned_department": {"$regex": f"^{re.escape(dept_name)}$", "$options": "i"}},
            {"assigned_department_name": {"$regex": f"^{re.escape(dept_name)}$", "$options": "i"}}
        ])

    query_condition = {"$or": or_clauses}
    return dept_id_str or dept_val, dept_name or dept_val, valid_identifiers, query_condition


def is_complaint_assigned_to_user(complaint: dict, valid_identifiers: set) -> bool:
    """
    Checks if a complaint is assigned to the authenticated department user
    by comparing against all canonical identifiers (IDs, names, case-insensitive).
    """
    if not complaint:
        return False

    c_dept = str(complaint.get("assigned_department") or "").strip().lower()
    c_name = str(complaint.get("assigned_department_name") or "").strip().lower()

    for ident in valid_identifiers:
        ident_lower = str(ident).strip().lower()
        if ident_lower and (c_dept == ident_lower or c_name == ident_lower):
            return True

    return False




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
    
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        from PIL import Image
        with Image.open(file.file) as img:
            if img.width > 640 or img.height > 640:
                img.thumbnail((640, 640))
            if img.mode == 'RGBA' and ext == 'jpg':
                img = img.convert('RGB')
            img.save(file_path, format=img.format if img.format else 'JPEG')
        logger.info(f"Analysis request received. Resized image ready: {safe_filename}")
    except Exception as e:
        logger.error(f"Image processing failed: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")
            
    try:
        t0 = time.time()
        logger.info(f"YOLO inference started for {safe_filename}")
        
        from starlette.concurrency import run_in_threadpool
        prediction_result = await run_in_threadpool(detector.predict, str(file_path))
        
        logger.info(f"YOLO inference completed for {safe_filename}. Available: {prediction_result.get('available')}")
        
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
            
            logger.info(f"Random Forest prediction started for {safe_filename}")
            pri_result = await run_in_threadpool(priority_predictor.predict, priority_features)
            logger.info(f"Random Forest prediction completed for {safe_filename}")
            if pri_result.get("available"):
                ai_prediction["priority"] = pri_result.get("priority")
                ai_prediction["priority_confidence"] = pri_result.get("priority_confidence")
                ai_prediction["model_name"] = f"{ai_prediction['model_name']} + RandomForest"
                ai_prediction["model_version"] = "1.1"
                
            logger.info(f"Endpoint completed successfully for {safe_filename}")
            return ai_prediction
        else:
            logger.info(f"Endpoint completed successfully for {safe_filename} (model not available)")
            return {"available": False, "reason": prediction_result.get("reason", "model_not_loaded")}
    except Exception as e:
        logger.error(f"Exception during analysis pipeline for {safe_filename}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
    finally:
        if file_path.exists():
            os.remove(file_path)

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(complaint: ComplaintCreate, current_user: dict = Depends(get_current_user)):
    complaint_data = complaint.model_dump()
    complaint_data["user_id"] = str(current_user["id"])
    now = datetime.now(timezone.utc)
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
        
    if current_user.get("role") == "department":
        _, _, valid_idents, _ = await get_user_department_identifiers(current_user)
        if not is_complaint_assigned_to_user(complaint, valid_idents):
            raise HTTPException(status_code=403, detail="Not authorized to view this complaint")
    elif current_user.get("role") != "admin" and complaint.get("user_id") != str(current_user["id"]):
        raise HTTPException(status_code=403, detail="Not authorized to view this complaint")
        
    user_id_str = complaint.get("user_id")
    if user_id_str and ObjectId.is_valid(user_id_str):
        user_doc = await db_instance.db.users.find_one({"_id": ObjectId(user_id_str)})
        if user_doc:
            complaint["user_name"] = user_doc.get("name")
            
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
    is_duplicate: Optional[bool] = None,
    duplicate_of: Optional[str] = None,
    assignment: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    and_conditions = []
    
    if status:
        and_conditions.append({"status": status})
    if category:
        and_conditions.append({"category": category})
    if duplicate_of:
        and_conditions.append({"duplicate_of": duplicate_of})
    if assignment == "assigned":
        and_conditions.append({"assigned_department": {"$ne": None}})
    elif assignment == "unassigned":
        and_conditions.append({"assigned_department": None})

    if current_user.get("role") == "department":
        _, _, _, dept_query = await get_user_department_identifiers(current_user)
        and_conditions.append(dept_query)
        if is_duplicate is not None:
            and_conditions.append({"is_duplicate": is_duplicate})
    else:
        if is_duplicate is not None:
            and_conditions.append({"is_duplicate": is_duplicate})
        elif primary_only:
            # If searching for an exact ID, do not restrict to primary_only
            clean_search_val = re.sub(r'(?i)^complaint\s*#?\s*', '', search or '').strip().lstrip('#')
            if not (clean_search_val and ObjectId.is_valid(clean_search_val)):
                and_conditions.append({"is_primary": {"$ne": False}})

    if priority:
        and_conditions.append({
            "$or": [
                {"priority": priority},
                {"aiPrediction.priority": priority}
            ]
        })
        
    if search:
        # Strip "complaint #" or "#" for natural id searching
        clean_search = re.sub(r'(?i)^complaint\s*#?\s*', '', search).strip()
        clean_search = clean_search.lstrip('#').strip()
        escaped_search = re.escape(clean_search)
        regex_compiled = re.compile(escaped_search, re.IGNORECASE)
        
        search_conditions = [
            {"category": regex_compiled},
            {"description": regex_compiled},
            {"user_id": regex_compiled},
            {"location.address": regex_compiled},
            {"$expr": {"$regexMatch": {"input": {"$toString": "$_id"}, "regex": escaped_search, "options": "i"}}}
        ]
        
        if ObjectId.is_valid(clean_search):
            search_conditions.append({"_id": ObjectId(clean_search)})
            
        and_conditions.append({"$or": search_conditions})

    query = {"$and": and_conditions} if and_conditions else {}
    cursor = db_instance.db.complaints.find(query).sort("created_at", -1)
    complaints = await cursor.to_list(length=10000)
    
    user_ids = list(set([c.get("user_id") for c in complaints if c.get("user_id")]))
    users = {}
    if user_ids:
        user_docs = await db_instance.db.users.find({"_id": {"$in": [ObjectId(uid) for uid in user_ids if ObjectId.is_valid(uid)]}}).to_list(length=10000)
        users = {str(u["_id"]): u.get("name") for u in user_docs}
        
    for c in complaints:
        uid = c.get("user_id")
        if uid and uid in users:
            c["user_name"] = users[uid]
            
    return [serialize_complaint(c) for c in complaints]

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(complaint_id: str, update_data: ComplaintUpdate, current_user: dict = Depends(get_current_department_user)):
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID format")
        
    valid_statuses = ["Pending", "In Progress", "Resolved"]
    if update_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    complaint = await db_instance.db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if current_user.get("role") == "department":
        _, _, valid_idents, _ = await get_user_department_identifiers(current_user)
        if not is_complaint_assigned_to_user(complaint, valid_idents):
            raise HTTPException(status_code=403, detail="Not authorized to update this complaint")
        
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
        
    now = datetime.now(timezone.utc)
    new_history_entry = {
        "status": new_status,
        "changed_at": now.isoformat(),
        "changed_by": str(current_user["id"]),
        "changed_by_role": current_user.get("role", "admin")
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
        
    if current_user.get("role") == "department":
        _, _, valid_idents, _ = await get_user_department_identifiers(current_user)
        if not is_complaint_assigned_to_user(complaint, valid_idents):
            raise HTTPException(status_code=403, detail="Not authorized to update this complaint")
    elif current_user.get("role") != "admin" and complaint.get("user_id") != str(current_user["id"]):
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
    
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        from PIL import Image
        with Image.open(file.file) as img:
            if img.width > 640 or img.height > 640:
                img.thumbnail((640, 640))
            if img.mode == 'RGBA' and ext == 'jpg':
                img = img.convert('RGB')
            img.save(file_path, format=img.format if img.format else 'JPEG')
        logger.info(f"Upload request received. Resized image ready: {safe_filename}")
        
        import cloudinary.uploader
        upload_result = cloudinary.uploader.upload(
            str(file_path),
            folder="urbanmind/complaints"
        )
        cloudinary_url = upload_result.get("secure_url")
        logger.info("Cloudinary upload successful")
    except Exception as e:
        logger.error(f"Image processing or upload failed: {e}")
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Image upload failed: {e}")
            
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
            logger.info(f"YOLO inference started for {safe_filename}")
            
            from starlette.concurrency import run_in_threadpool
            prediction_result = await run_in_threadpool(detector.predict, str(file_path))
            
            logger.info(f"YOLO inference completed for {safe_filename}. Available: {prediction_result.get('available')}")
            
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
                
                from starlette.concurrency import run_in_threadpool
                logger.info(f"Random Forest prediction started for {safe_filename}")
                pri_result = await run_in_threadpool(priority_predictor.predict, priority_features)
                logger.info(f"Random Forest prediction completed for {safe_filename}")
                
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

                
    image_url = cloudinary_url
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
            "updated_at": datetime.now(timezone.utc)
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
    if file_path.exists():
        try:
            os.remove(file_path)
        except Exception:
            pass

    return serialize_complaint(updated_complaint)
@router.patch("/{complaint_id}/assign", response_model=ComplaintResponse)
async def assign_complaint(complaint_id: str, assign_data: ComplaintAssign, current_admin: dict = Depends(get_current_active_admin)):
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID format")
    if not ObjectId.is_valid(assign_data.department_id):
        raise HTTPException(status_code=400, detail="Invalid department ID format")

    complaint_obj_id = ObjectId(complaint_id)
    dept_obj_id = ObjectId(assign_data.department_id)

    # Verify complaint
    complaint = await db_instance.db.complaints.find_one({"_id": complaint_obj_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Verify department
    department = await db_instance.db.departments.find_one({"_id": dept_obj_id})
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    if not department.get("is_active"):
        raise HTTPException(status_code=400, detail="Cannot assign to an inactive department")

    now = datetime.now(timezone.utc)
    update_fields = {
        "assigned_department": str(dept_obj_id),
        "assigned_department_name": department.get("name"),
        "assigned_at": now,
        "assigned_by": current_admin.get("id"),
        "updated_at": now
    }

    await db_instance.db.complaints.update_one(
        {"_id": complaint_obj_id},
        {"$set": update_fields}
    )

    # Synchronize assignment across any duplicate complaints belonging to this cluster
    await db_instance.db.complaints.update_many(
        {"duplicate_of": str(complaint_obj_id)},
        {"$set": update_fields}
    )

    updated_complaint = await db_instance.db.complaints.find_one({"_id": complaint_obj_id})
    return serialize_complaint(updated_complaint)


@router.post("/{complaint_id}/progress-notes", response_model=ComplaintResponse)
async def add_progress_note(complaint_id: str, note_data: ProgressNoteCreate, current_user: dict = Depends(get_current_department_user)):
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID format")
        
    complaint = await db_instance.db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if current_user.get("role") == "department":
        _, _, valid_idents, _ = await get_user_department_identifiers(current_user)
        if not is_complaint_assigned_to_user(complaint, valid_idents):
            raise HTTPException(status_code=403, detail="Not authorized to add notes to this complaint")
            
    note_id = str(uuid.uuid4())
    new_note = {
        "id": note_id,
        "note": note_data.note.strip(),
        "created_at": datetime.now(timezone.utc),
        "created_by": str(current_user["id"]),
        "created_by_name": current_user.get("name", "Unknown"),
        "department": current_user.get("department", "Admin")
    }
    
    updated_complaint = await db_instance.db.complaints.find_one_and_update(
        {"_id": ObjectId(complaint_id)},
        {"$push": {"progress_notes": new_note}},
        return_document=True
    )
    return serialize_complaint(updated_complaint)

@router.post("/{complaint_id}/field-evidence", response_model=ComplaintResponse)
async def upload_field_evidence(complaint_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_department_user)):
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid complaint ID format")
        
    complaint = await db_instance.db.complaints.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    if current_user.get("role") == "department":
        _, _, valid_idents, _ = await get_user_department_identifiers(current_user)
        if not is_complaint_assigned_to_user(complaint, valid_idents):
            raise HTTPException(status_code=403, detail="Not authorized to upload evidence to this complaint")
            
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported image format")
        
    file.file.seek(0, 2)
    if file.file.tell() > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")
    file.file.seek(0)
    
    ext = file.content_type.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"

    safe_filename = f"field_{complaint_id}_{uuid.uuid4().hex}.{ext}"
    uploads_dir = Path(__file__).parent.parent.parent / "uploads" / "complaints"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = uploads_dir / safe_filename
    
    with open(file_path, "wb") as buffer:
        while chunk := file.file.read(8192):
            buffer.write(chunk)
            
    try:
        import cloudinary.uploader
        upload_result = cloudinary.uploader.upload(
            str(file_path),
            folder="urbanmind/field-evidence"
        )
        file_url = upload_result.get("secure_url")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {e}")
    finally:
        if file_path.exists():
            os.remove(file_path)
            
    evidence_id = str(uuid.uuid4())
    
    new_evidence = {
        "id": evidence_id,
        "file_url": file_url,
        "file_name": file.filename,
        "uploaded_at": datetime.now(timezone.utc),
        "uploaded_by": str(current_user["id"]),
        "uploaded_by_name": current_user.get("name", "Unknown"),
        "department": current_user.get("department", "Admin")
    }
    
    updated_complaint = await db_instance.db.complaints.find_one_and_update(
        {"_id": ObjectId(complaint_id)},
        {"$push": {"field_evidence": new_evidence}},
        return_document=True
    )
    return serialize_complaint(updated_complaint)
