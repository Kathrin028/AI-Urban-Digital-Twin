import sys
import os
from pathlib import Path
from app.ml.detection.detector import CivicIssueDetector

def test_detector(image_path: str):
    if not os.path.exists(image_path):
        print(f"Error: Image {image_path} does not exist.")
        sys.exit(1)
        
    print(f"Testing detector on image: {image_path}")
    detector = CivicIssueDetector()
    
    print("\nInitial detector state:")
    print(f"Available: {detector.is_available()}")
    
    # Normally we would load the model here
    # detector.load_model(Path(__file__).parent.parent / "models" / "detection" / "best.pt")
    
    result = detector.predict(image_path)
    print("\nPrediction result:")
    print(result)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_detector.py <image_path>")
        sys.exit(1)
        
    test_detector(sys.argv[1])
