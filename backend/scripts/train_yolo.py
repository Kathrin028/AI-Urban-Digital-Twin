import argparse
from pathlib import Path
from ultralytics import YOLO
import torch

def train_baseline(data_yaml: str, epochs: int, imgsz: int, batch: int, device: str):
    print("--- UrbanMind AI YOLOv8 Training ---")
    print(f"Data config: {data_yaml}")
    print(f"Epochs: {epochs} | Imgsz: {imgsz} | Batch: {batch} | Device: {device}")
    
    # Verify dataset exists
    data_path = Path(data_yaml)
    if not data_path.exists():
        print(f"Error: Dataset config {data_yaml} not found.")
        print("BLOCKED: Dataset not ready.")
        return

    # Check actual device
    actual_device = "cpu"
    if device.lower() == "gpu" or device.lower() == "cuda":
        if torch.cuda.is_available():
            actual_device = 0
            print(f"CUDA is available. Using GPU: {torch.cuda.get_device_name(0)}")
        else:
            print("Warning: GPU requested but CUDA is not available. Falling back to CPU.")
            
    print(f"Final device selection: {actual_device}")

    # Load baseline model
    model = YOLO("yolov8n.pt")  # Start from pretrained nano model
    
    # Train
    print("Starting training...")
    try:
        results = model.train(
            data=str(data_path.absolute()),
            epochs=epochs,
            imgsz=imgsz,
            batch=batch,
            device=actual_device,
            project=str(Path(__file__).parent.parent / "ml_runs" / "detection"),
            name="baseline_run"
        )
        print("Training completed successfully.")
    except Exception as e:
        print(f"Training failed: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train UrbanMind YOLOv8 Detector")
    parser.add_argument("--data", type=str, default="../ml_data/yolo/data.yaml", help="Path to data.yaml")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--device", type=str, default="cuda", help="Device (cpu or cuda)")
    args = parser.parse_args()
    
    # Resolve relative path from script dir
    script_dir = Path(__file__).parent
    data_yaml_path = (script_dir / args.data).resolve()
    
    train_baseline(
        data_yaml=str(data_yaml_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device
    )
