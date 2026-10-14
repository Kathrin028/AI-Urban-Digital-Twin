import os
import time
from datetime import datetime
import json
from pathlib import Path
import logging
import numpy as np

logger = logging.getLogger(__name__)

# Class mapping based on model dataset:
# 0 -> Garbage, 1 -> Pothole, 2 -> Water Leakage (Empty), 3 -> Road Damage
CLASS_MAPPING = {
    0: "Garbage",
    1: "Pothole",
    2: "Water Leakage",
    3: "Road Damage"
}

# Empirical confidence thresholds based on custom model convergence (1 epoch fine-tuning):
# - Class 0 (Garbage): 0.05 (empirically calibrated: captures genuine civic garbage features peaking 0.05-0.10 while rejecting negative controls <0.02)
# - Class 1 (Pothole): 0.05 (subtle feature representation peaks ~0.05-0.08)
# - Class 3 (Road Damage): 0.10 (damage features peak ~0.10-0.23)
CLASS_THRESHOLDS = {
    0: 0.05,  # Garbage
    1: 0.05,  # Pothole
    3: 0.10   # Road Damage
}

def nms(boxes, scores, iou_threshold=0.45):
    """Lightweight NumPy Non-Maximum Suppression (single-class / class-agnostic)."""
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

def nms_multiclass(boxes, scores, class_ids, iou_threshold=0.45):
    """Multi-Class Non-Maximum Suppression with class offsets to prevent cross-class suppression."""
    if len(boxes) == 0:
        return []

    max_wh = 4096.0
    c = class_ids[:, None] * max_wh
    offset_boxes = boxes + c

    x1 = offset_boxes[:, 0]
    y1 = offset_boxes[:, 1]
    x2 = offset_boxes[:, 2]
    y2 = offset_boxes[:, 3]
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
        self.conf_threshold = 0.10
        self.iou_threshold = 0.45
        self.class_thresholds = CLASS_THRESHOLDS

    def load_model(self, model_path: str):
        try:
            import onnxruntime as ort
            if os.path.exists(model_path):
                sess_options = ort.SessionOptions()
                sess_options.intra_op_num_threads = 1
                sess_options.inter_op_num_threads = 1
                sess_options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL

                self.session = ort.InferenceSession(
                    model_path,
                    sess_options=sess_options,
                    providers=['CPUExecutionProvider']
                )
                input_meta = self.session.get_inputs()[0]
                output_meta = self.session.get_outputs()[0]
                self.input_name = input_meta.name
                self.output_name = output_meta.name

                if len(input_meta.shape) >= 4 and isinstance(input_meta.shape[2], int):
                    self.imgsz = input_meta.shape[2]

                self.available = True
                logger.info(
                    f"Loaded YOLO ONNX model from {model_path} | "
                    f"Input: {self.input_name} {input_meta.shape} | "
                    f"Output: {self.output_name} {output_meta.shape} | imgsz={self.imgsz}"
                )
            else:
                logger.warning(f"Model path does not exist: {model_path}")
                self.available = False
        except Exception as e:
            logger.error(f"Failed to load YOLO ONNX model: {e}", exc_info=True)
            self.available = False

    def is_available(self) -> bool:
        return self.available

    def predict(self, image_path: str, conf_threshold: float = None) -> dict:
        now_str = datetime.utcnow().isoformat() + "Z"

        if not self.available:
            return {
                "available": False,
                "reason": "model_not_loaded"
            }

        try:
            from PIL import Image

            start_time = time.time()

            # 1. Letterbox Preprocessing
            img = Image.open(image_path).convert("RGB")
            orig_w, orig_h = img.size
            scale = min(self.imgsz / orig_w, self.imgsz / orig_h)
            new_w = max(1, int(round(orig_w * scale)))
            new_h = max(1, int(round(orig_h * scale)))

            pad_x = (self.imgsz - new_w) // 2
            pad_y = (self.imgsz - new_h) // 2

            img_resized = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
            img_padded = Image.new("RGB", (self.imgsz, self.imgsz), (114, 114, 114))
            img_padded.paste(img_resized, (pad_x, pad_y))

            img_np = np.array(img_padded, dtype=np.float32).transpose(2, 0, 1) / 255.0
            input_tensor = np.expand_dims(img_np, axis=0)

            # 2. ONNX Model Inference
            outputs = self.session.run([self.output_name], {self.input_name: input_tensor})
            raw_out = outputs[0]  # Shape: (1, 8, 2100)
            preds = raw_out[0].transpose()  # Shape: (2100, 8)

            boxes = preds[:, :4]  # [cx, cy, w, h] in 320x320 space
            scores = preds[:, 4:]  # Class probabilities [Garbage, Pothole, WaterLeakage, RoadDamage]

            # 3. Local Debugging & Shape Logging
            raw_max_score = float(np.max(scores))
            raw_max_cls = int(np.argmax(np.max(scores, axis=0)))
            per_class_max = {
                CLASS_MAPPING.get(c, f"Class_{c}"): round(float(np.max(scores[:, c])), 4)
                for c in range(min(scores.shape[1], 4))
            }
            logger.info(
                f"[YOLO Debug] Image: {Path(image_path).name} ({orig_w}x{orig_h}) | "
                f"Input tensor: {input_tensor.shape} | Raw output: {raw_out.shape} | "
                f"Raw max score: {raw_max_score:.4f} ({CLASS_MAPPING.get(raw_max_cls, 'Unknown')}) | "
                f"Per-class max: {per_class_max}"
            )

            # 4. Class-specific Confidence Filtering
            cand_boxes, cand_scores, cand_classes = [], [], []
            supported_classes = [0, 1, 3]  # Garbage, Pothole, Road Damage (excluding empty class 2)

            for cls_id in supported_classes:
                cls_scores = scores[:, cls_id]
                th = conf_threshold if conf_threshold is not None else self.class_thresholds.get(cls_id, self.conf_threshold)
                mask = cls_scores >= th
                if np.any(mask):
                    cand_boxes.append(boxes[mask])
                    cand_scores.append(cls_scores[mask])
                    cand_classes.append(np.full(np.sum(mask), cls_id, dtype=int))

            if not cand_boxes:
                inference_time_ms = round((time.time() - start_time) * 1000)
                logger.info(
                    f"[YOLO Debug] No proposals survived confidence filtering for {Path(image_path).name}. "
                    f"Thresholds: {self.class_thresholds}. Returning null detection."
                )
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

            cand_boxes = np.vstack(cand_boxes)
            cand_scores = np.concatenate(cand_scores)
            cand_classes = np.concatenate(cand_classes)

            # 5. Decode Bounding Boxes (cx, cy, w, h -> x1, y1, x2, y2 scaled back to original image)
            cx, cy, w, h = cand_boxes[:, 0], cand_boxes[:, 1], cand_boxes[:, 2], cand_boxes[:, 3]
            x1 = np.clip((cx - w / 2 - pad_x) / scale, 0, orig_w)
            y1 = np.clip((cy - h / 2 - pad_y) / scale, 0, orig_h)
            x2 = np.clip((cx + w / 2 - pad_x) / scale, 0, orig_w)
            y2 = np.clip((cy + h / 2 - pad_y) / scale, 0, orig_h)
            final_boxes_xyxy = np.column_stack((x1, y1, x2, y2))

            # 6. Apply Multi-Class NMS
            keep_indices = nms_multiclass(final_boxes_xyxy, cand_scores, cand_classes, iou_threshold=self.iou_threshold)

            bounding_boxes = []
            best_conf = 0.0
            best_class_id = None

            for idx in keep_indices:
                cls_id = int(cand_classes[idx])
                conf = float(cand_scores[idx])
                bx1, by1, bx2, by2 = final_boxes_xyxy[idx]
                category_name = CLASS_MAPPING.get(cls_id, "Unknown")

                bounding_boxes.append({
                    "class_id": cls_id,
                    "category": category_name,
                    "confidence": round(conf, 2),
                    "box": [round(float(bx1), 2), round(float(by1), 2), round(float(bx2), 2), round(float(by2), 2)]
                })

                if conf > best_conf:
                    best_conf = conf
                    best_class_id = cls_id

            inference_time_ms = round((time.time() - start_time) * 1000)

            if best_class_id is not None:
                category = CLASS_MAPPING.get(best_class_id, "Unknown")
                logger.info(
                    f"[YOLO Detection] {Path(image_path).name} -> Detected '{category}' "
                    f"with confidence {round(best_conf, 2)} ({len(bounding_boxes)} box(es)) in {inference_time_ms}ms"
                )
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
            logger.error(f"Inference failed on {image_path}: {e}", exc_info=True)
            return {
                "available": False,
                "reason": f"inference_error: {str(e)}"
            }

detector = CivicIssueDetector()
