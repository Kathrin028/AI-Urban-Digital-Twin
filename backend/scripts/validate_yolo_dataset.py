import os
from pathlib import Path

def validate_dataset(dataset_root: str):
    root = Path(dataset_root)
    labels_dir = root / "labels"
    
    if not labels_dir.exists():
        print(f"Error: {labels_dir} does not exist.")
        return False
        
    valid_classes = {0, 1, 2, 3, 4}
    total_labels = 0
    errors = 0
    
    for split in ["train", "val", "test"]:
        split_dir = labels_dir / split
        if not split_dir.exists():
            continue
            
        for label_file in split_dir.glob("*.txt"):
            total_labels += 1
            with open(label_file, "r") as f:
                for line_idx, line in enumerate(f):
                    parts = line.strip().split()
                    if not parts:
                        continue
                        
                    if len(parts) != 5:
                        print(f"Error in {label_file}:{line_idx}: Expected 5 values, got {len(parts)}")
                        errors += 1
                        continue
                        
                    try:
                        class_id = int(parts[0])
                        if class_id not in valid_classes:
                            print(f"Error in {label_file}:{line_idx}: Unknown class_id {class_id}")
                            errors += 1
                            
                        coords = [float(x) for x in parts[1:]]
                        for c in coords:
                            if c < 0 or c > 1:
                                print(f"Error in {label_file}:{line_idx}: Coordinate {c} out of bounds (0-1)")
                                errors += 1
                                
                        if coords[2] <= 0 or coords[3] <= 0:
                            print(f"Error in {label_file}:{line_idx}: Width/Height must be > 0")
                            errors += 1
                    except ValueError:
                        print(f"Error in {label_file}:{line_idx}: Non-numeric values found")
                        errors += 1

    print(f"Validation complete. Processed {total_labels} label files.")
    print(f"Total errors: {errors}")
    return errors == 0

if __name__ == "__main__":
    dataset_path = Path(__file__).parent.parent / "ml_data" / "yolo"
    validate_dataset(str(dataset_path))
