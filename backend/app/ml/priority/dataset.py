import random
import pandas as pd
from datetime import datetime, timedelta
import asyncio
from app.database.connection import db_instance

class PriorityDatasetManager:
    def __init__(self):
        self.min_real_samples = 50
        
    async def get_real_complaints(self):
        complaints = []
        cursor = db_instance.db.complaints.find({})
        async for doc in cursor:
            # We need complaints that already have an assigned priority for training.
            # However, if this is bootstrap, none might have priority.
            # Wait, if we use real complaints, they must have some Ground Truth priority assigned by Admins.
            # For now, let's just pull them if they exist and have a priority, otherwise we skip.
            # But wait, this is unsupervised/supervised? Priority is supervised. If it's real data, it must have 'priority' set by an Admin.
            # For simplicity, we just count them.
            if "priority" in doc and doc["priority"] in ["Low", "Medium", "High"]:
                complaints.append(doc)
        return complaints

    def _extract_features(self, doc):
        # Extract features
        category = doc.get("category", "Unknown")
        
        yolo_conf = 0.0
        bbox_count = 0
        ai_pred = doc.get("ai_prediction", doc.get("aiPrediction", {}))
        if ai_pred:
            yolo_conf = ai_pred.get("confidence", 0.0)
            bbox_count = len(ai_pred.get("bounding_boxes", []))
            
        created_at = doc.get("created_at", datetime.utcnow())
        age_days = (datetime.utcnow() - created_at).days
        if age_days < 0:
            age_days = 0
            
        image_exists = 1 if doc.get("image_url") else 0
        
        # We don't have repeat complaint count easily available without aggregation, 
        # so we mock it for extraction unless we implement geo-queries. 
        # For this model, we'll assume 0 for now if real, or we could aggregate.
        repeat_count = 0 
        
        priority = doc.get("priority", "Low")
        
        return {
            "category": category,
            "yolo_confidence": yolo_conf,
            "bounding_box_count": bbox_count,
            "complaint_age_days": age_days,
            "repeat_complaint_count": repeat_count,
            "image_exists": image_exists,
            "priority": priority
        }

    def generate_synthetic_data(self, n_samples=500):
        data = []
        categories = ["Garbage", "Pothole", "Road Damage", "Water Leakage", "Drainage"]
        priorities = ["Low", "Medium", "High"]
        
        for _ in range(n_samples):
            cat = random.choice(categories)
            
            # Create somewhat realistic correlations
            if cat in ["Pothole", "Road Damage"]:
                yolo_conf = random.uniform(0.5, 0.99)
                bbox_count = random.randint(1, 5)
                image_exists = 1
                priority = random.choice(["Medium", "High"])
            elif cat in ["Garbage"]:
                yolo_conf = random.uniform(0.3, 0.8)
                bbox_count = random.randint(1, 10)
                image_exists = random.choice([0, 1])
                priority = random.choice(["Low", "Medium"])
            else:
                yolo_conf = random.uniform(0.0, 0.6)
                bbox_count = random.randint(0, 2)
                image_exists = random.choice([0, 1])
                priority = random.choice(["Low", "Medium", "High"])
                
            age_days = random.randint(0, 30)
            repeat_count = random.randint(0, 10)
            
            # Boost priority if high repeat count or high age
            if repeat_count > 5 or age_days > 14:
                priority = "High"
                
            # Random noise
            if random.random() < 0.1:
                priority = random.choice(priorities)
                
            data.append({
                "category": cat,
                "yolo_confidence": yolo_conf,
                "bounding_box_count": bbox_count,
                "complaint_age_days": age_days,
                "repeat_complaint_count": repeat_count,
                "image_exists": image_exists,
                "priority": priority
            })
            
        return pd.DataFrame(data)

    async def get_training_data(self):
        real_complaints = await self.get_real_complaints()
        
        if len(real_complaints) >= self.min_real_samples:
            source = "Real Complaint Data"
            df = pd.DataFrame([self._extract_features(doc) for doc in real_complaints])
        else:
            source = "Synthetic Bootstrap Data"
            df = self.generate_synthetic_data(n_samples=1000)
            
        return df, source
