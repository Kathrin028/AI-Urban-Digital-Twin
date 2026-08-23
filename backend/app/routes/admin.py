from fastapi import APIRouter, Depends
from app.database.connection import db_instance
from app.core.dependencies import get_current_active_admin

router = APIRouter()

@router.get("/dashboard/stats")
async def get_dashboard_stats(current_admin: dict = Depends(get_current_active_admin)):
    total = await db_instance.db.complaints.count_documents({"is_primary": {"$ne": False}})
    pending = await db_instance.db.complaints.count_documents({"status": "Pending", "is_primary": {"$ne": False}})
    in_progress = await db_instance.db.complaints.count_documents({"status": "In Progress", "is_primary": {"$ne": False}})
    resolved = await db_instance.db.complaints.count_documents({"status": "Resolved", "is_primary": {"$ne": False}})
    
    citizen_reports = await db_instance.db.complaints.count_documents({})
    duplicate_reports = await db_instance.db.complaints.count_documents({"is_duplicate": True})
    
    high_priority = await db_instance.db.complaints.count_documents({
        "is_primary": {"$ne": False},
        "$or": [
            {"priority": "High"},
            {"aiPrediction.priority": "High"}
        ]
    })
    
    return {
        "total": total,
        "pending": pending,
        "in_progress": in_progress,
        "resolved": resolved,
        "high_priority": high_priority,
        "citizen_reports": citizen_reports,
        "duplicate_reports": duplicate_reports
    }

from app.ml.clustering.clusterer import hotspot_clusterer

@router.get("/hotspots")
async def get_hotspots(current_admin: dict = Depends(get_current_active_admin)):
    # Lightweight cache invalidation based on latest updated complaint and count
    total = await db_instance.db.complaints.count_documents({})
    latest = await db_instance.db.complaints.find_one(sort=[("updated_at", -1)])
    
    if total == 0:
        return []
        
    latest_time = latest.get("updated_at") if latest else None
    cache_key = f"{total}_{latest_time}"
    
    # Check if cache is hit inside detect_hotspots
    cached_clusters = hotspot_clusterer.detect_hotspots([], cache_key)
    if cached_clusters and hotspot_clusterer._cache["key"] == cache_key and hotspot_clusterer._cache["data"] is not None:
        if len(hotspot_clusterer._cache["data"]) > 0 or total < 2:
            return hotspot_clusterer._cache["data"]

    # Cache miss or need to re-compute
    cursor = db_instance.db.complaints.find({})
    complaints = await cursor.to_list(length=None)
    
    clusters = hotspot_clusterer.detect_hotspots(complaints, cache_key)
    return clusters

from app.services.analytics import get_analytics_summary

@router.get("/analytics")
async def get_analytics(current_admin: dict = Depends(get_current_active_admin)):
    data = await get_analytics_summary()
    return data
