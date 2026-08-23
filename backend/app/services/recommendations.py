def get_recommended_action(complaint: dict) -> dict:
    status = complaint.get("status", "")
    if status == "Resolved":
        return {
            "action": "Verify resolution and close complaint",
            "reason": "The complaint has already been marked as resolved.",
            "severity": "resolved"
        }

    ai_pred = complaint.get("ai_prediction") or complaint.get("aiPrediction")
    
    if not ai_pred or not ai_pred.get("available") or not ai_pred.get("priority"):
        return {
            "action": "Recommendation unavailable",
            "reason": "AI analysis is not available yet.",
            "severity": "unknown"
        }
        
    priority = ai_pred.get("priority", "Low")
    in_hotspot = complaint.get("in_hotspot", False)
    repeat_count = complaint.get("repeat_complaint_count", 0)
    
    if priority == "High":
        if in_hotspot:
            return {
                "action": "Inspect within 24 hours",
                "reason": "High-priority issue located in an active civic hotspot.",
                "severity": "high"
            }
        if repeat_count > 0:
            return {
                "action": "Escalate for immediate municipal review",
                "reason": "High-priority issue with repeated complaints.",
                "severity": "high"
            }
        return {
            "action": "Prioritize field inspection",
            "reason": "Complaint has been classified as high priority.",
            "severity": "high"
        }
        
    if priority == "Medium":
        return {
            "action": "Schedule field inspection",
            "reason": "Complaint requires municipal attention but is not currently classified as high priority.",
            "severity": "medium"
        }
        
    if priority == "Low":
        return {
            "action": "Add to routine maintenance",
            "reason": "Complaint is currently classified as low priority.",
            "severity": "low"
        }
        
    return {
        "action": "Recommendation unavailable",
        "reason": "AI analysis is not available yet.",
        "severity": "unknown"
    }
