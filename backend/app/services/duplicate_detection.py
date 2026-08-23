import math
from datetime import datetime, timedelta

DUPLICATE_RADIUS_METERS = 100
DUPLICATE_TIME_WINDOW_DAYS = 7

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula
    R = 6371000 # Radius of Earth in meters
    phi_1 = math.radians(lat1)
    phi_2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2.0)**2 + \
        math.cos(phi_1) * math.cos(phi_2) * math.sin(delta_lambda/2.0)**2
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

async def get_ultimate_primary(comp, db):
    current = comp
    visited = set()
    while current.get("is_duplicate", False) and current.get("duplicate_of"):
        dup_id = current.get("duplicate_of")
        if dup_id in visited:
            break
        visited.add(dup_id)
        from bson import ObjectId
        if not ObjectId.is_valid(dup_id):
            break
        parent = await db.complaints.find_one({"_id": ObjectId(dup_id)})
        if not parent:
            break
        current = parent
    return str(current["_id"])

async def check_similar_complaints(category: str, lat: float, lng: float, db, current_complaint_id: str = None) -> dict:
    if not category or lat is None or lng is None:
        return {
            "possible_duplicate": False,
            "matches": [],
            "primary_complaint_id": None,
            "reason": "Missing required fields (category, latitude, or longitude)"
        }
        
    try:
        # Time window filter
        time_threshold = datetime.utcnow() - timedelta(days=DUPLICATE_TIME_WINDOW_DAYS)
        
        query = {
            "category": category,
            "created_at": {"$gte": time_threshold}
        }
        
        if current_complaint_id:
            from bson import ObjectId
            if ObjectId.is_valid(current_complaint_id):
                query["_id"] = {"$ne": ObjectId(current_complaint_id)}
                
        cursor = db.complaints.find(query)
        recent_complaints = await cursor.to_list(length=100)
        
        matches = []
        for comp in recent_complaints:
            loc = comp.get("location")
            if not loc:
                continue
                
            c_lat = loc.get("latitude")
            c_lng = loc.get("longitude")
            
            if c_lat is None or c_lng is None:
                continue
                
            try:
                c_lat = float(c_lat)
                c_lng = float(c_lng)
            except ValueError:
                continue
                
            dist = calculate_distance(lat, lng, c_lat, c_lng)
            
            if dist <= DUPLICATE_RADIUS_METERS:
                created_at = comp.get("created_at")
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00").split(".")[0])
                    except Exception:
                        created_at = datetime.utcnow()
                
                age_days = (datetime.utcnow() - created_at.replace(tzinfo=None)).days
                age_str = f"{age_days} days ago" if age_days > 0 else "Today"
                
                matches.append({
                    "complaint_id": str(comp["_id"]),
                    "category": comp.get("category"),
                    "distance_meters": int(dist),
                    "reported_date": age_str,
                    "status": comp.get("status"),
                    "created_at": created_at,
                    "original_doc": comp
                })
                
        # Sort by distance first, then we can pick the oldest primary
        matches.sort(key=lambda x: x["distance_meters"])
        
        primary_complaint_id = None
        if len(matches) > 0:
            # We want the oldest active primary among the matches.
            # Alternatively, if there's any match, we resolve it to its ultimate primary.
            # Sorting matches by date ascending (oldest first)
            oldest_match = sorted(matches, key=lambda x: x["created_at"])[0]
            primary_complaint_id = await get_ultimate_primary(oldest_match["original_doc"], db)
            
        # Remove original_doc from matches before returning
        for m in matches:
            if "original_doc" in m:
                del m["original_doc"]
            if "created_at" in m:
                del m["created_at"]
        
        return {
            "possible_duplicate": len(matches) > 0,
            "matches": matches[:5], # Limit to top 5 closest
            "primary_complaint_id": primary_complaint_id
        }
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Duplicate detection error: {e}")
        return {
            "possible_duplicate": False,
            "matches": [],
            "primary_complaint_id": None,
            "reason": "Service error"
        }
