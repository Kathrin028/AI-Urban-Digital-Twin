import os
import sys
from pathlib import Path
from collections import Counter, defaultdict
import numpy as np
from PIL import Image

# Ensure backend package is in python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.detection.detector import detector, CLASS_MAPPING, CLASS_THRESHOLDS

TEST_IMG_DIR = Path("D:/Projects/AI-Urban-Digital-Twin/backend/ml_data/yolo/final_dataset/images/test")
TEST_LBL_DIR = Path("D:/Projects/AI-Urban-Digital-Twin/backend/ml_data/yolo/final_dataset/labels/test")
VAL_IMG_DIR = Path("D:/Projects/AI-Urban-Digital-Twin/backend/ml_data/yolo/final_dataset/images/val")
VAL_LBL_DIR = Path("D:/Projects/AI-Urban-Digital-Twin/backend/ml_data/yolo/final_dataset/labels/val")
MODEL_PATH = Path("D:/Projects/AI-Urban-Digital-Twin/backend/models/detection/urbanmind_yolov1/weights/best.onnx")

def predict_original_uncalibrated(session, in_name, out_name, img_path):
    """Replicates the original detector logic before postprocessing improvements."""
    img = Image.open(img_path).convert("RGB")
    orig_w, orig_h = img.size
    scale = min(320 / orig_w, 320 / orig_h)
    new_w = max(1, int(round(orig_w * scale)))
    new_h = max(1, int(round(orig_h * scale)))
    pad_x = (320 - new_w) // 2
    pad_y = (320 - new_h) // 2

    img_resized = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
    img_padded = Image.new("RGB", (320, 320), (114, 114, 114))
    img_padded.paste(img_resized, (pad_x, pad_y))

    img_np = np.array(img_padded, dtype=np.float32).transpose(2, 0, 1) / 255.0
    input_tensor = np.expand_dims(img_np, axis=0)

    raw_out = session.run([out_name], {in_name: input_tensor})[0]
    preds = raw_out[0].transpose()
    boxes = preds[:, :4]
    scores = preds[:, 4:]

    # Original thresholds (0.05 Garbage, 0.05 Pothole, 0.10 Road Damage)
    cand_boxes, cand_scores, cand_classes = [], [], []
    for cls_id in [0, 1, 3]:
        th = 0.05 if cls_id in [0, 1] else 0.10
        mask = scores[:, cls_id] >= th
        if np.any(mask):
            cand_boxes.append(boxes[mask])
            cand_scores.append(scores[mask, cls_id])
            cand_classes.append(np.full(np.sum(mask), cls_id, dtype=int))

    if not cand_boxes:
        return None, 0.0, []

    cand_boxes = np.vstack(cand_boxes)
    cand_scores = np.concatenate(cand_scores)
    cand_classes = np.concatenate(cand_classes)

    # Original unpadding (without padding filter or degenerate box rejection)
    cx, cy, w, h = cand_boxes[:, 0], cand_boxes[:, 1], cand_boxes[:, 2], cand_boxes[:, 3]
    x1 = np.clip((cx - w / 2 - pad_x) / scale, 0, orig_w)
    y1 = np.clip((cy - h / 2 - pad_y) / scale, 0, orig_h)
    x2 = np.clip((cx + w / 2 - pad_x) / scale, 0, orig_w)
    y2 = np.clip((cy + h / 2 - pad_y) / scale, 0, orig_h)
    final_boxes = np.column_stack((x1, y1, x2, y2))

    # Original NMS
    from app.ml.detection.detector import nms_multiclass
    keep = nms_multiclass(final_boxes, cand_scores, cand_classes, iou_threshold=0.45)

    # Original global max confidence selection
    best_conf = 0.0
    best_cls = None
    boxes_out = []
    for idx in keep:
        c = int(cand_classes[idx])
        conf = float(cand_scores[idx])
        boxes_out.append({"class_id": c, "category": CLASS_MAPPING.get(c, "Unknown"), "confidence": conf})
        if conf > best_conf:
            best_conf = conf
            best_cls = c

    category = CLASS_MAPPING.get(best_cls) if best_cls is not None else None
    return category, round(best_conf, 2), boxes_out

def evaluate_dataset(img_dir, lbl_dir, predictor_func, desc="Evaluation"):
    import onnxruntime as ort
    session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    in_name = session.get_inputs()[0].name
    out_name = session.get_outputs()[0].name

    results = []
    files = sorted([f for f in os.listdir(img_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))])

    for f in files:
        base = os.path.splitext(f)[0]
        lbl_file = lbl_dir / f"{base}.txt"
        if not lbl_file.exists():
            continue

        with open(lbl_file, "r") as fl:
            lines = [l.strip() for l in fl.readlines() if l.strip()]
        class_set = set(int(l.split()[0]) for l in lines)

        # Ground truth resolution:
        # Documented policy:
        # - Class 0: Garbage
        # - Class 3: Road Damage (if 3 in class_set)
        # - Class 1: Pothole (if 1 in class_set and 3 not in class_set)
        if 0 in class_set:
            gt_primary = "Garbage"
        elif 3 in class_set:
            gt_primary = "Road Damage"
        elif 1 in class_set:
            gt_primary = "Pothole"
        else:
            gt_primary = "None"

        has_garbage = 0 in class_set
        has_road_damage = 3 in class_set
        has_pothole = 1 in class_set

        img_path = img_dir / f
        pred_cat, pred_conf, boxes = predictor_func(session, in_name, out_name, str(img_path))
        pred_label = pred_cat if pred_cat is not None else "None"

        results.append({
            "file": f,
            "gt_classes": class_set,
            "gt_primary": gt_primary,
            "has_garbage": has_garbage,
            "has_road_damage": has_road_damage,
            "has_pothole": has_pothole,
            "pred_label": pred_label,
            "pred_conf": pred_conf,
            "boxes": boxes
        })

    return results

def compute_metrics(results):
    labels = ["Garbage", "Road Damage", "Pothole", "None"]
    matrix = Counter((r["gt_primary"], r["pred_label"]) for r in results)

    class_metrics = {}
    for target in ["Garbage", "Road Damage", "Pothole"]:
        tp = matrix.get((target, target), 0)
        fp = sum(matrix.get((o, target), 0) for o in labels if o != target)
        fn = sum(matrix.get((target, o), 0) for o in labels if o != target)
        tn = sum(matrix.get((o, p), 0) for o in labels for p in labels if o != target and p != target)

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

        class_metrics[target] = {
            "tp": tp, "fp": fp, "fn": fn, "tn": tn,
            "precision": prec, "recall": rec, "f1": f1, "fpr": fpr
        }

    return matrix, class_metrics

def print_benchmark_table(title, matrix, class_metrics, num_samples):
    labels = ["Garbage", "Road Damage", "Pothole", "None"]
    print(f"\n{'='*75}")
    print(f" {title} (N = {num_samples} images)")
    print(f"{'='*75}")
    print("Confusion Matrix (Rows: Ground Truth, Columns: Prediction):")
    header = f"{'Ground Truth':15} | " + " | ".join(f"{l:>12}" for l in labels)
    print(header)
    print("-" * len(header))
    for t in labels:
        row = [matrix.get((t, p), 0) for p in labels]
        print(f"{t:15} | " + " | ".join(f"{v:12d}" for v in row))

    print("\nDetailed Per-Class Performance:")
    print(f"{'Category':15} | {'Precision':>10} | {'Recall':>10} | {'F1-Score':>10} | {'FPR':>10} | {'TP':>4} | {'FP':>4} | {'FN':>4} | {'TN':>4}")
    print("-" * 88)
    for target in ["Garbage", "Road Damage", "Pothole"]:
        m = class_metrics[target]
        print(f"{target:15} | {m['precision']:10.3f} | {m['recall']:10.3f} | {m['f1']:10.3f} | {m['fpr']:10.3f} | {m['tp']:4d} | {m['fp']:4d} | {m['fn']:4d} | {m['tn']:4d}")

def run_calibrated_predictor(session, in_name, out_name, img_path):
    res = detector.predict(img_path)
    return res.get("category"), res.get("confidence", 0), res.get("bounding_boxes", [])

if __name__ == "__main__":
    if not detector.is_available():
        detector.load_model(str(MODEL_PATH))

    print("=== URBANMIND AI VISION PIPELINE BENCHMARK ===")

    # 1. Validation Set (Separately reproduced)
    print("\n[1/3] Evaluating Validation Set (Independent threshold calibration split)...")
    val_results = evaluate_dataset(VAL_IMG_DIR, VAL_LBL_DIR, run_calibrated_predictor, desc="Validation")
    val_matrix, val_metrics = compute_metrics(val_results)
    print_benchmark_table("VALIDATION SET (Calibrated Postprocessing)", val_matrix, val_metrics, len(val_results))

    # 2. Held-Out Test Set: Before vs After
    print("\n[2/3] Evaluating Held-Out Test Set (Unseen test split)...")
    test_results_before = evaluate_dataset(TEST_IMG_DIR, TEST_LBL_DIR, predict_original_uncalibrated, desc="Test Before")
    test_matrix_before, test_metrics_before = compute_metrics(test_results_before)
    print_benchmark_table("HELD-OUT TEST SET — BEFORE (Original Pipeline)", test_matrix_before, test_metrics_before, len(test_results_before))

    test_results_after = evaluate_dataset(TEST_IMG_DIR, TEST_LBL_DIR, run_calibrated_predictor, desc="Test After")
    test_matrix_after, test_metrics_after = compute_metrics(test_results_after)
    print_benchmark_table("HELD-OUT TEST SET — AFTER (Calibrated Postprocessing)", test_matrix_after, test_metrics_after, len(test_results_after))

    # 3. Target Images & Negative Controls Check
    print("\n[3/3] Target Complaint Images & Negative Control Analysis:")
    target_images = {
        "Garbage Image 1 (6a8085eb...)": Path("D:/Projects/AI-Urban-Digital-Twin/backend/uploads/complaints/6a8085eb8848b02a43e6c807_2b0bb1089a394164b9674fadee70e99b.jpg"),
        "Garbage Image 2 (6a89b321...)": Path("D:/Projects/AI-Urban-Digital-Twin/backend/uploads/complaints/6a89b321a76b2fee4ae74edd_4119e77b84714c9fbc402bd9dd99110d.jpg"),
        "Garbage Image 3 (6a89a174...)": Path("D:/Projects/AI-Urban-Digital-Twin/backend/uploads/complaints/6a89a17462d94c86c7f85c58_963f3fb953104067a046b5fc04200e32.jpg"),
        "Road Damage 1 (6a8085c3...)": Path("D:/Projects/AI-Urban-Digital-Twin/backend/uploads/complaints/6a8085c38848b02a43e6c806_eeecdfed54244074abaa3fd3c75ea423.jpg"),
        "Road Damage 2 (rdd_000874)": Path("D:/Projects/AI-Urban-Digital-Twin/backend/ml_data/yolo/final_dataset/images/test/rdd_India_000874.jpg"),
        "Pothole 1 (rdd_002379)": Path("D:/Projects/AI-Urban-Digital-Twin/backend/ml_data/yolo/final_dataset/images/test/rdd_India_002379.jpg"),
        "Hero.png (Frontend Asset)": Path("D:/Projects/AI-Urban-Digital-Twin/frontend/src/assets/images/Hero.png")
    }

    import onnxruntime as ort
    session = ort.InferenceSession(str(MODEL_PATH), providers=["CPUExecutionProvider"])
    in_name = session.get_inputs()[0].name
    out_name = session.get_outputs()[0].name

    print(f"\n{'Image Name':32} | {'Before Prediction':22} | {'After Prediction':22} | {'Status':8}")
    print("-" * 90)
    for name, p in target_images.items():
        if p.exists():
            cat_b, conf_b, _ = predict_original_uncalibrated(session, in_name, out_name, str(p))
            res_a = detector.predict(str(p))
            cat_a = res_a.get("category")
            conf_a = res_a.get("confidence", 0)
            status = "RESOLVED" if ("Garbage" in name and cat_a == "Garbage") or ("Road Damage" in name and cat_a == "Road Damage") or ("Hero" in name and cat_a is None) else "CHECK"
            print(f"{name:32} | {str(cat_b) + ' (' + str(conf_b) + ')':22} | {str(cat_a) + ' (' + str(conf_a) + ')':22} | {status:8}")

    print("\nNegative Control Images Suite:")
    neg_dir = Path("D:/Projects/AI-Urban-Digital-Twin/backend/tests/fixtures/negative_controls")
    if neg_dir.exists():
        for fn in sorted(os.listdir(neg_dir)):
            p = neg_dir / fn
            res = detector.predict(str(p))
            print(f"  {fn:28} -> Category: {str(res.get('category')):12} | Conf: {res.get('confidence')}")
