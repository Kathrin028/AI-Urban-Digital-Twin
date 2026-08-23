import os
import time
from datetime import datetime
import json
from pathlib import Path

# Class mapping based on user requirements
# 0 -> Garbage, 1 -> Pothole, 3 -> Road Damage
CLASS_MAPPING = {
    0: "Garbage",
    1: "Pothole",
    2: "Water Leakage", # Ignored as per rules, but mapped just in case
    3: "Road Damage"
}

class CivicIssueDetector:
    def __init__(self):
        self.available = False
        self.model = None
        self.model_name = "YOLOv8n"
        self.version = "1.0"

    def load_model(self, model_path: str):
        try:
            from ultralytics import YOLO
            if os.path.exists(model_path):
                self.model = YOLO(model_path)
                self.available = True
                print(f"Loaded YOLO model from {model_path}")
            else:
                print(f"Model path does not exist: {model_path}")
                self.available = False
        except Exception as e:
            print(f"Failed to load YOLO model: {e}")
            self.available = False

    def is_available(self) -> bool:
        return self.available

    def predict(self, image_path: str) -> dict:
        now_str = datetime.utcnow().isoformat() + "Z"
        
        if not self.available:
            return {
                "available": False,
                "reason": "model_not_loaded"
            }
            
        try:
            start_time = time.time()
            results = self.model(image_path, conf=0.02)
            inference_time_ms = round((time.time() - start_time) * 1000)
            
            if not results:
                raise ValueError("No results returned from YOLO model (possible image read error).")
                
            result = results[0]
            boxes = result.boxes
            
            best_conf = 0
            best_class_id = None
            bounding_boxes = []
            
            if boxes is not None:
                for box in boxes:
                    if len(box.cls) == 0:
                        continue
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    bounding_boxes.append({
                        "class_id": cls_id,
                        "confidence": conf,
                        "box": [x1, y1, x2, y2]
                    })
                    
                    # We care only about classes 0, 1, 3
                    if cls_id in [0, 1, 3] and conf > best_conf:
                        best_conf = conf
                        best_class_id = cls_id
                    
            if best_class_id is not None:
                category = CLASS_MAPPING.get(best_class_id, "Unknown")
                return {
                    "available": True,
                    "category": category,
                    "confidence": round(best_conf, 2),
                    "bounding_boxes": bounding_boxes,
                    "model_name": self.model_name,
                    "model_version": self.version,
                    "inference_time_ms": inference_time_ms,
                    "analyzed_at": now_str
                }
            else:
                return {
                    "available": True,
                    "category": None,
                    "confidence": 0,
                    "bounding_boxes": [],
                    "model_name": self.model_name,
                    "model_version": self.version,
                    "inference_time_ms": inference_time_ms,
                    "analyzed_at": now_str
                }
                
        except Exception as e:
            print(f"Inference failed: {e}")
            return {
                "available": False,
                "reason": f"inference_error: {str(e)}"
            }

detector = CivicIssueDetector()
