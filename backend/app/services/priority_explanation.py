from datetime import datetime

def generate_priority_factors(complaint: dict) -> list:
    factors = []
    
    ai_pred = complaint.get("ai_prediction") or complaint.get("aiPrediction")
    
    if not ai_pred or not ai_pred.get("available"):
        return factors
        
    # 1. YOLO confidence
    conf = ai_pred.get("confidence", 0)
    if conf >= 0.8:
        factors.append("High AI detection confidence")
    elif conf >= 0.4:
        factors.append("Moderate AI detection confidence")
        
    # 2. Bounding boxes
    boxes = ai_pred.get("bounding_boxes", [])
    if len(boxes) > 1:
        factors.append("Multiple damage regions detected")
    elif len(boxes) == 1:
        factors.append("Single damage region detected")
        
    # 3. Complaint age
    created_at = complaint.get("created_at") or complaint.get("date")
    if created_at:
        if isinstance(created_at, str):
            try:
                # Handle iso format
                created_at_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00").split(".")[0])
                age_days = (datetime.utcnow() - created_at_dt.replace(tzinfo=None)).days
            except Exception:
                age_days = 0
        else:
            age_days = (datetime.utcnow() - created_at).days
            
        if age_days > 14:
            factors.append("Complaint has remained unresolved for an extended period")
            
    # 4. Repeat complaints
    repeat_count = complaint.get("repeat_complaint_count", 0)
    if repeat_count > 0:
        factors.append("Similar/repeated complaints have been reported")
        
    # 5. Hotspot
    if complaint.get("in_hotspot"):
        factors.append("Complaint is located in an active civic hotspot")
        
    # 6. Category
    category = complaint.get("category", "")
    if category in ["Pothole", "Road Damage", "Water Leakage", "Garbage", "Drainage"]:
        factors.append("Detected issue category requires attention")
        
    return factors
