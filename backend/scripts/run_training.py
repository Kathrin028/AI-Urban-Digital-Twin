import os
import json
import datetime
from pathlib import Path
from ultralytics import YOLO
import torch
import ultralytics
import time

def train_and_evaluate():
    # Setup paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_yaml = os.path.join(base_dir, "ml_data", "yolo", "final_dataset", "data.yaml")
    project_dir = os.path.join(base_dir, "models", "detection")
    
    # Initialize model
    model = YOLO("yolov8n.pt")
    
    # 1. Train
    print("--- Starting YOLOv8 Training ---")
    results = model.train(
        data=data_yaml,
        epochs=1,
        imgsz=160,
        batch=-1,
        device="cpu",
        optimizer="auto",
        cache=False,
        patience=20,
        project=project_dir,
        name="urbanmind_yolov1",
        exist_ok=True
    )
    
    run_dir = os.path.join(project_dir, "urbanmind_yolov1")
    
    # 2. Evaluate (Validation set)
    print("\n--- Starting Evaluation ---")
    # model = YOLO(os.path.join(run_dir, "weights", "best.pt"))
    val_results = model.val()
    
    # Extract metrics
    metrics = {
        "precision": val_results.results_dict.get('metrics/precision(B)', 0),
        "recall": val_results.results_dict.get('metrics/recall(B)', 0),
        "mAP50": val_results.results_dict.get('metrics/mAP50(B)', 0),
        "mAP50-95": val_results.results_dict.get('metrics/mAP50-95(B)', 0)
    }
    
    if metrics["precision"] + metrics["recall"] > 0:
        metrics["f1"] = 2 * (metrics["precision"] * metrics["recall"]) / (metrics["precision"] + metrics["recall"])
    else:
        metrics["f1"] = 0
        
    class_metrics = {}
    if hasattr(val_results, 'box') and hasattr(val_results.box, 'map_per_class'):
        # Just safely grab what's available
        pass

    # 3. Inference on 10 validation images
    print("\n--- Running Inference on Validation Set ---")
    val_images_dir = os.path.join(base_dir, "ml_data", "yolo", "final_dataset", "images", "val")
    val_images = [os.path.join(val_images_dir, f) for f in os.listdir(val_images_dir) if f.endswith('.jpg')][:10]
    
    inference_results = []
    for img_path in val_images:
        t0 = time.time()
        preds = model(img_path)[0]
        t1 = time.time()
        
        boxes = []
        for box in preds.boxes:
            boxes.append({
                "class_id": int(box.cls[0].item()),
                "class_name": model.names[int(box.cls[0].item())],
                "confidence": float(box.conf[0].item()),
                "bbox": box.xyxy[0].tolist()
            })
            
        inference_results.append({
            "image": os.path.basename(img_path),
            "inference_time_ms": (t1 - t0) * 1000,
            "detections": boxes
        })
        
    print(json.dumps(inference_results, indent=2))
    
    # 4. Generate metadata.json
    metadata = {
        "model_version": "urbanmind_yolov1",
        "training_date": datetime.datetime.utcnow().isoformat() + "Z",
        "dataset_size": 1840,
        "classes": model.names,
        "metrics": metrics,
        "environment": {
            "ultralytics_version": ultralytics.__version__,
            "torch_version": torch.__version__,
            "cuda_available": torch.cuda.is_available()
        },
        "inference_sample": inference_results
    }
    
    with open(os.path.join(project_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=4)
        
    print("\n--- Training and Evaluation Complete ---")
    print("Metrics:", json.dumps(metrics, indent=2))

if __name__ == "__main__":
    train_and_evaluate()
