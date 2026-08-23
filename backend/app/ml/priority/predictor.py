import os
import joblib
import pandas as pd
import numpy as np

class PriorityPredictor:
    def __init__(self):
        self.available = False
        self.pipeline = None

    def load_model(self, model_path: str):
        try:
            if os.path.exists(model_path):
                self.pipeline = joblib.load(model_path)
                self.available = True
                print(f"Loaded Random Forest priority model from {model_path}")
            else:
                print(f"Priority model path does not exist: {model_path}")
                self.available = False
        except Exception as e:
            print(f"Failed to load Priority model: {e}")
            self.available = False

    def predict(self, feature_dict: dict) -> dict:
        if not self.available or self.pipeline is None:
            return {
                "available": False,
                "priority": None,
                "priority_confidence": None,
                "reason": "model_not_loaded"
            }
            
        try:
            # We need to construct a DataFrame with a single row 
            # that matches the columns used in training.
            df = pd.DataFrame([{
                "category": feature_dict.get("category", "Unknown"),
                "yolo_confidence": float(feature_dict.get("yolo_confidence", 0.0)),
                "bounding_box_count": int(feature_dict.get("bounding_box_count", 0)),
                "complaint_age_days": int(feature_dict.get("complaint_age_days", 0)),
                "repeat_complaint_count": int(feature_dict.get("repeat_complaint_count", 0)),
                "image_exists": int(feature_dict.get("image_exists", 1))
            }])
            
            # Predict
            pred = self.pipeline.predict(df)[0]
            
            # Confidence
            probas = self.pipeline.predict_proba(df)[0]
            conf = float(np.max(probas))
            
            return {
                "available": True,
                "priority": pred,
                "priority_confidence": round(conf, 2)
            }
        except Exception as e:
            print(f"Priority prediction failed: {e}")
            return {
                "available": False,
                "priority": None,
                "priority_confidence": None,
                "reason": f"inference_error: {str(e)}"
            }

priority_predictor = PriorityPredictor()
