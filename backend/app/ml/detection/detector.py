import os
import time
from datetime import datetime
import json
from pathlib import Path
import numpy as np

# Class mapping based on user requirements
# 0 -> Garbage, 1 -> Pothole, 3 -> Road Damage
CLASS_MAPPING = {
    0: "Garbage",
    1: "Pothole",
    2: "Water Leakage", # Ignored as per rules, but mapped just in case
    3: "Road Damage"
}

def nms(boxes, scores, iou_threshold=0.45):
    """Lightweight NumPy Non-Maximum Suppression"""
    if len(boxes) == 0:
        return []
    
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 2]
    y2 = boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    
    order = scores.argsort()[::-1]
    keep = []
    
    while order.size > 0:
        i = order[0]
        keep.append(i)
        
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        
        iou = inter / (areas[i] + areas[order[1:]] - inter + 1e-6)
        inds = np.where(iou <= iou_threshold)[0]
        order = order[inds + 1]
        
    return keep

class CivicIssueDetector:
    def __init__(self):
        self.available = False
        self.session = None
        self.input_name = None
        self.output_name = None
        self.model_name = "YOLOv8n-ONNX"
        self.version = "1.0"
        self.imgsz = 320

    def load_model(self, model_path: str):
        try:
            import onnxruntime as ort
            if os.path.exists(model_path):
                self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
                self.input_name = self.session.get_inputs()[0].name
                self.output_name = self.session.get_outputs()[0].name
                self.available = True
                print(f"Loaded YOLO ONNX model from {model_path}")
            else:
                print(f"Model path does not exist: {model_path}")
                self.available = False
        except Exception as e:
            print(f"Failed to load YOLO ONNX model: {e}")
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
            import numpy as np
            from PIL import Image
            
            start_time = time.time()
            
            # Preprocessing
            img = Image.open(image_path).convert("RGB")
            orig_w, orig_h = img.size
            scale = min(self.imgsz / orig_w, self.imgsz / orig_h)
            new_unpad_w, new_unpad_h = int(orig_w * scale), int(orig_h * scale)
            
            # Avoid error on tiny images
            new_unpad_w = max(1, new_unpad_w)
            new_unpad_h = max(1, new_unpad_h)
            
            img_resized = img.resize((new_unpad_w, new_unpad_h), Image.Resampling.LANCZOS)
            dw = (self.imgsz - new_unpad_w) / 2.0
            dh = (self.imgsz - new_unpad_h) / 2.0
            
            img_padded = Image.new("RGB", (self.imgsz, self.imgsz), (114, 114, 114))
            img_padded.paste(img_resized, (int(dw), int(dh)))
            
            img_np = np.array(img_padded, dtype=np.float32).transpose(2, 0, 1) / 255.0
            input_tensor = np.expand_dims(img_np, axis=0)
            
            # Inference
            outputs = self.session.run([self.output_name], {self.input_name: input_tensor})
            preds = outputs[0][0].transpose() # Shape: [2100, 8]
            
            # Parse predictions
            boxes = preds[:, :4]
            scores = preds[:, 4:]
            
            max_scores = np.max(scores, axis=1)
            class_ids = np.argmax(scores, axis=1)
            
            # Confidence threshold
            conf_mask = max_scores > 0.02
            boxes = boxes[conf_mask]
            max_scores = max_scores[conf_mask]
            class_ids = class_ids[conf_mask]
            
            # Convert cx, cy, w, h to x1, y1, x2, y2
            cx, cy, w, h = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
            x1 = cx - w / 2
            y1 = cy - h / 2
            x2 = cx + w / 2
            y2 = cy + h / 2
            
            # Unpad and scale
            x1 = (x1 - dw) / scale
            y1 = (y1 - dh) / scale
            x2 = (x2 - dw) / scale
            y2 = (y2 - dh) / scale
            
            # Clip
            x1 = np.clip(x1, 0, orig_w)
            y1 = np.clip(y1, 0, orig_h)
            x2 = np.clip(x2, 0, orig_w)
            y2 = np.clip(y2, 0, orig_h)
            
            final_boxes_xyxy = np.column_stack((x1, y1, x2, y2))
            
            # Apply NMS
            keep_indices = nms(final_boxes_xyxy, max_scores, iou_threshold=0.45)
            
            best_conf = 0
            best_class_id = None
            bounding_boxes = []
            
            for idx in keep_indices:
                cls_id = int(class_ids[idx])
                conf = float(max_scores[idx])
                bx1, by1, bx2, by2 = final_boxes_xyxy[idx]
                
                bounding_boxes.append({
                    "class_id": cls_id,
                    "confidence": conf,
                    "box": [float(bx1), float(by1), float(bx2), float(by2)]
                })
                
                # We care only about classes 0, 1, 3
                if cls_id in [0, 1, 3] and conf > best_conf:
                    best_conf = conf
                    best_class_id = cls_id
                    
            inference_time_ms = round((time.time() - start_time) * 1000)
            
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
            import traceback
            traceback.print_exc()
            print(f"Inference failed: {e}")
            return {
                "available": False,
                "reason": f"inference_error: {str(e)}"
            }

detector = CivicIssueDetector()
