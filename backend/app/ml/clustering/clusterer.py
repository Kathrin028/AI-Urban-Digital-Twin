import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import time

PRIORITY_WEIGHTS = {
    "Low": 1,
    "Medium": 2,
    "High": 3
}

class HotspotClusterer:
    def __init__(self):
        self._cache = {
            "key": None,
            "data": None
        }

    def _get_optimal_k(self, coords, max_k=10):
        n_samples = len(coords)
        if n_samples < 2:
            return 1
            
        actual_max_k = min(max_k, n_samples - 1)
        if actual_max_k < 2:
            return 1
            
        best_k = 2
        best_score = -1

        for k in range(2, actual_max_k + 1):
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
            labels = kmeans.fit_predict(coords)
            
            # Silhouette score is only defined if 1 < n_labels < n_samples
            if len(np.unique(labels)) > 1:
                score = silhouette_score(coords, labels)
                if score > best_score:
                    best_score = score
                    best_k = k
                    
        return best_k

    def detect_hotspots(self, complaints, cache_key=None):
        if cache_key is not None and self._cache["key"] == cache_key:
            return self._cache["data"]

        # Filter complaints with valid coords
        valid_complaints = []
        for c in complaints:
            if "location" in c and c["location"]:
                try:
                    lat = float(c["location"]["latitude"])
                    lng = float(c["location"]["longitude"])
                    valid_complaints.append((c, lat, lng))
                except (ValueError, TypeError, KeyError):
                    continue
                    
        if not valid_complaints:
            self._cache = {"key": cache_key, "data": []}
            return []

        coords = np.array([[lat, lng] for _, lat, lng in valid_complaints])
        
        # Determine K
        k = self._get_optimal_k(coords)
        
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(coords)
        centers = kmeans.cluster_centers_

        clusters = []
        for i in range(k):
            cluster_complaints = [valid_complaints[j][0] for j in range(len(valid_complaints)) if labels[j] == i]
            
            if not cluster_complaints:
                continue
                
            categories = {}
            total_priority_score = 0
            highest_priority_level = "Low"
            
            high_count = 0
            medium_count = 0
            low_count = 0
            resolved_count = 0
            active_count = 0
            
            for c in cluster_complaints:
                cat = c.get("category", "Unknown")
                categories[cat] = categories.get(cat, 0) + 1
                
                # Try ai_prediction first, then fallback to db priority
                priority = "Medium"
                if "ai_prediction" in c and c["ai_prediction"] and "priority" in c["ai_prediction"]:
                    priority = c["ai_prediction"]["priority"]
                elif "aiPrediction" in c and c["aiPrediction"] and "priority" in c["aiPrediction"]:
                    priority = c["aiPrediction"]["priority"]
                elif "priority" in c and c["priority"]:
                    priority = c["priority"]
                    
                w = PRIORITY_WEIGHTS.get(priority, 2)
                total_priority_score += w
                
                if priority == "High": high_count += 1
                elif priority == "Medium": medium_count += 1
                else: low_count += 1
                
                if PRIORITY_WEIGHTS.get(priority, 2) > PRIORITY_WEIGHTS.get(highest_priority_level, 2):
                    highest_priority_level = priority
                    
                status = c.get("status", "Pending")
                if status == "Resolved":
                    resolved_count += 1
                else:
                    active_count += 1
            
            dominant_category = max(categories, key=categories.get)
            avg_w = total_priority_score / len(cluster_complaints)
            
            if avg_w >= 2.5:
                avg_priority = "High"
            elif avg_w >= 1.5:
                avg_priority = "Medium"
            else:
                avg_priority = "Low"
                
            res_pct = round((resolved_count / len(cluster_complaints)) * 100, 2)

            area_name = f"Area {i}"
            for c in cluster_complaints:
                addr = c.get("location", {}).get("address")
                if addr and addr != "Citizen reported location":
                    area_name = addr
                    break

            cluster_data = {
                "area_id": i,
                "area_name": area_name,
                "cluster_id": i,
                "latitude": float(centers[i][0]),
                "longitude": float(centers[i][1]),
                "complaint_count": len(cluster_complaints),
                "total_complaints": len(cluster_complaints),
                "high_priority": high_count,
                "medium_priority": medium_count,
                "low_priority": low_count,
                "resolved": resolved_count,
                "active": active_count,
                "resolution_percentage": res_pct,
                "dominant_category": dominant_category,
                "average_priority": avg_priority,
                "average_priority_score": round(float(avg_w), 2),
                "priority_score": round(float(avg_w), 2),
                "highest_priority_level": highest_priority_level,
                "complaint_ids": [str(c.get("_id", c.get("id", ""))) for c in cluster_complaints]
            }
            clusters.append(cluster_data)

        self._cache = {"key": cache_key, "data": clusters}
        return clusters

hotspot_clusterer = HotspotClusterer()
