from app.database.connection import db_instance
from app.ml.clustering.clusterer import hotspot_clusterer
from datetime import datetime, timedelta
import time

_analytics_cache = {
    "key": None,
    "timestamp": 0,
    "data": None
}

def get_hotspot_trend_analysis(clusters, all_complaints):
    now = datetime.utcnow()
    current_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)
    
    complaint_map = {str(c.get("_id", c.get("id", ""))): c for c in all_complaints}
    
    trends = []
    
    for cluster in clusters:
        area_id = cluster["area_id"]
        c_ids = cluster.get("complaint_ids", [])
        
        curr_total = 0
        curr_high = 0
        curr_resolved = 0
        
        prev_total = 0
        prev_high = 0
        prev_resolved = 0
        
        for cid in c_ids:
            c = complaint_map.get(cid)
            if not c: continue
            
            dt = c.get("created_at") or c.get("date")
            if dt:
                if isinstance(dt, str):
                    try:
                        dt = datetime.fromisoformat(dt.replace("Z", "+00:00").split("+")[0])
                    except:
                        continue
                        
                is_current = current_start <= dt <= now
                is_previous = previous_start <= dt < current_start
                
                if is_current or is_previous:
                    # Determine priority
                    priority = "Medium"
                    if "ai_prediction" in c and c["ai_prediction"] and "priority" in c["ai_prediction"]:
                        priority = c["ai_prediction"]["priority"]
                    elif "aiPrediction" in c and c["aiPrediction"] and "priority" in c["aiPrediction"]:
                        priority = c["aiPrediction"]["priority"]
                    elif "priority" in c and c["priority"]:
                        priority = c["priority"]
                        
                    status = c.get("status", "Pending")
                    
                    if is_current:
                        curr_total += 1
                        if priority == "High": curr_high += 1
                        if status == "Resolved": curr_resolved += 1
                    elif is_previous:
                        prev_total += 1
                        if priority == "High": prev_high += 1
                        if status == "Resolved": prev_resolved += 1
                        
        change = curr_total - prev_total
        pct_change = 0
        if prev_total > 0:
            pct_change = round((change / prev_total) * 100, 2)
        elif curr_total > 0:
            pct_change = 100.0
            
        trend = "STABLE"
        if pct_change <= -10:
            trend = "IMPROVING"
        elif pct_change >= 10:
            trend = "WORSENING"
            
        trends.append({
            "area_id": area_id,
            "current_complaints": curr_total,
            "previous_complaints": prev_total,
            "complaint_change": change,
            "complaint_change_percentage": pct_change,
            "current_high_priority": curr_high,
            "previous_high_priority": prev_high,
            "current_resolved": curr_resolved,
            "previous_resolved": prev_resolved,
            "trend": trend
        })
        
    return trends

async def get_analytics_summary():
    total = await db_instance.db.complaints.count_documents({})
    latest = await db_instance.db.complaints.find_one(sort=[("updated_at", -1)])
    latest_time = latest.get("updated_at") if latest else None
    
    cache_key = f"{total}_{latest_time}"
    current_time = time.time()
    
    # TTL = 5 mins (300 seconds) or cache invalidation on data change
    if _analytics_cache["key"] == cache_key and (current_time - _analytics_cache["timestamp"] < 300):
        data = _analytics_cache["data"].copy()
        data["cache_age_seconds"] = int(current_time - _analytics_cache["timestamp"])
        return data

    # 1. Total Complaints (Primary)
    total_complaints = await db_instance.db.complaints.count_documents({"is_primary": {"$ne": False}})
    citizen_reports_count = total
    duplicate_reports_count = await db_instance.db.complaints.count_documents({"is_duplicate": True})
    
    # 2. Resolved Percentage & Avg Resolution Time (Primary only)
    resolved_cursor = db_instance.db.complaints.find({"status": "Resolved", "is_primary": {"$ne": False}})
    resolved_complaints = await resolved_cursor.to_list(length=None)
    resolved_count = len(resolved_complaints)
    
    resolved_percentage = round((resolved_count / total_complaints * 100), 2) if total_complaints > 0 else 0
    
    total_resolution_seconds = 0
    for c in resolved_complaints:
        if "created_at" in c and "updated_at" in c:
            try:
                diff = c["updated_at"] - c["created_at"]
                total_resolution_seconds += diff.total_seconds()
            except Exception:
                pass
                
    avg_res_days = 0
    if resolved_count > 0:
        avg_res_days = round((total_resolution_seconds / resolved_count) / 86400, 1)

    # 3. High Priority Count (Primary only)
    high_priority_count = await db_instance.db.complaints.count_documents({
        "is_primary": {"$ne": False},
        "$or": [
            {"priority": "High"},
            {"aiPrediction.priority": "High"},
            {"ai_prediction.priority": "High"}
        ]
    })
    
    # 4. Aggregations (Category, Status, Priority) - Primary only for the charts to represent issues
    all_complaints = await db_instance.db.complaints.find({}).to_list(length=None)
    primary_complaints = [c for c in all_complaints if c.get("is_primary", True) is not False]

    
    category_counts = {}
    status_counts = {}
    priority_counts = {}
    daily_counts = {}
    monthly_counts = {}
    
    ai_detections = 0
    ai_conf_sum = 0
    ai_priority_weights = {"Low": 1, "Medium": 2, "High": 3}
    ai_priority_sum = 0
    
    for c in primary_complaints:
        cat = c.get("category", "Unknown")
        category_counts[cat] = category_counts.get(cat, 0) + 1
        
        stat = c.get("status", "Pending")
        status_counts[stat] = status_counts.get(stat, 0) + 1
        
        # Determine Priority
        pri = "Medium"
        if "ai_prediction" in c and c["ai_prediction"] and "priority" in c["ai_prediction"]:
            pri = c["ai_prediction"]["priority"]
        elif "aiPrediction" in c and c["aiPrediction"] and "priority" in c["aiPrediction"]:
            pri = c["aiPrediction"]["priority"]
        elif "priority" in c and c["priority"]:
            pri = c["priority"]
            
        priority_counts[pri] = priority_counts.get(pri, 0) + 1
        
        # AI Metrics
        ai_pred = c.get("ai_prediction") or c.get("aiPrediction")
        if ai_pred and ai_pred.get("available"):
            ai_detections += 1
            ai_conf_sum += ai_pred.get("confidence", 0)
            ai_priority_sum += ai_priority_weights.get(pri, 2)
            
        # Trends
        dt = c.get("created_at") or c.get("date")
        if dt:
            if isinstance(dt, str):
                try:
                    dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
                except:
                    dt = datetime.utcnow()
                    
            day_str = dt.strftime("%Y-%m-%d")
            month_str = dt.strftime("%Y-%m")
            
            daily_counts[day_str] = daily_counts.get(day_str, 0) + 1
            monthly_counts[month_str] = monthly_counts.get(month_str, 0) + 1
            
    # Format charts
    category_distribution = [{"name": k, "value": v} for k, v in category_counts.items()]
    status_distribution = [{"name": k, "value": v} for k, v in status_counts.items()]
    priority_distribution = [{"name": k, "value": v} for k, v in priority_counts.items()]
    
    # Sort dates
    daily_trend = [{"date": k, "count": v} for k, v in sorted(daily_counts.items())[-30:]]
    monthly_trend = [{"month": k, "count": v} for k, v in sorted(monthly_counts.items())[-12:]]

    # Calculate AI Averages
    avg_det_conf = round(ai_conf_sum / ai_detections, 2) if ai_detections > 0 else 0
    
    avg_pred_score = ai_priority_sum / ai_detections if ai_detections > 0 else 0
    avg_pred_pri = "Medium"
    if avg_pred_score >= 2.5: avg_pred_pri = "High"
    elif avg_pred_score <= 1.5: avg_pred_pri = "Low"

    # 5. Hotspot Summary
    clusters = hotspot_clusterer.detect_hotspots(all_complaints, cache_key=cache_key)
    hotspot_trends = get_hotspot_trend_analysis(clusters, all_complaints)
    
    total_hotspots = len(clusters)
    largest_hotspot = max([c["complaint_count"] for c in clusters]) if clusters else 0
    
    highest_pri = "None"
    if clusters:
        highest_score = -1
        for c in clusters:
            if c["priority_score"] > highest_score:
                highest_score = c["priority_score"]
                highest_pri = c["highest_priority_level"]

    data = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "cache_age_seconds": 0,
        "summary": {
            "total_complaints": total_complaints,
            "citizen_reports_count": citizen_reports_count,
            "duplicate_reports_count": duplicate_reports_count,
            "resolved_percentage": resolved_percentage,
            "average_resolution_time": avg_res_days, # in days
            "high_priority_count": high_priority_count
        },
        "charts": {
            "category_distribution": category_distribution,
            "status_distribution": status_distribution,
            "priority_distribution": priority_distribution,
            "daily_trend": daily_trend,
            "monthly_trend": monthly_trend
        },
        "hotspots": {
            "total_hotspots": total_hotspots,
            "largest_hotspot": largest_hotspot,
            "highest_priority_hotspot": highest_pri
        },
        "ai_summary": {
            "yolo_detections": ai_detections,
            "average_detection_confidence": avg_det_conf,
            "average_predicted_priority": avg_pred_pri
        },
        "area_analytics": clusters,
        "hotspot_trend_analysis": hotspot_trends
    }
    
    _analytics_cache["key"] = cache_key
    _analytics_cache["timestamp"] = current_time
    _analytics_cache["data"] = data
    
    return data
