import os
import shutil
import random
import json
import datetime
from PIL import Image

def merge_datasets():
    # Setup paths
    rdd_base = "../ml_data/yolo/mini_dataset/rdd2022_yolo"
    taco_base = "../ml_data/yolo/source/taco"
    final_base = "../ml_data/yolo/final_dataset"
    
    # 0 -> Garbage, 1 -> Pothole, 3 -> Road Damage
    
    rdd_img_dir = os.path.join(rdd_base, "images")
    rdd_lbl_dir = os.path.join(rdd_base, "labels")
    
    taco_data_dir = os.path.join(taco_base, "data")
    taco_json = os.path.join(taco_data_dir, "annotations.json")
    
    # Ensure final directories
    splits = ['train', 'val', 'test']
    for s in splits:
        os.makedirs(os.path.join(final_base, "images", s), exist_ok=True)
        os.makedirs(os.path.join(final_base, "labels", s), exist_ok=True)
        
    stats = {
        "images_processed": 0,
        "images_converted": 0,
        "conversion_failures": 0,
        "bounding_boxes_total": 0,
        "class_counts": {
            "0_Garbage": 0,
            "1_Pothole": 0,
            "3_Road_Damage": 0
        },
        "split_counts": {
            "train": 0,
            "val": 0,
            "test": 0
        },
        "skipped_images": 0,
        "skipped_xmls": 0,
        "missing_labels": 0,
        "invalid_yolo_coordinates": 0,
        "corrupted_images": 0,
        "duplicate_filenames": 0
    }
    
    dataset_items = []
    
    # --- RDD2022 Processing ---
    if os.path.exists(rdd_img_dir) and os.path.exists(rdd_lbl_dir):
        rdd_images = [f for f in os.listdir(rdd_img_dir) if f.lower().endswith('.jpg')]
        for img_name in rdd_images:
            base = os.path.splitext(img_name)[0]
            txt_name = base + ".txt"
            img_path = os.path.join(rdd_img_dir, img_name)
            lbl_path = os.path.join(rdd_lbl_dir, txt_name)
            
            if not os.path.exists(lbl_path):
                stats["missing_labels"] += 1
                continue
                
            dataset_items.append({
                "source": "rdd",
                "base_name": "rdd_" + base,
                "img_path": img_path,
                "lbl_path": lbl_path
            })
            
    # --- TACO Processing ---
    if os.path.exists(taco_json):
        with open(taco_json, 'r') as f:
            taco_data = json.load(f)
            
        img_dict = {img['id']: img for img in taco_data['images']}
        img_annos = {img['id']: [] for img in taco_data['images']}
        for ann in taco_data['annotations']:
            img_annos[ann['image_id']].append(ann)
            
        for img_id, img_info in img_dict.items():
            img_file = img_info['file_name']
            img_path = os.path.join(taco_data_dir, img_file)
            
            if not os.path.exists(img_path):
                stats["skipped_images"] += 1
                continue
                
            # verify image
            try:
                with Image.open(img_path) as im:
                    im.verify()
            except Exception:
                stats["corrupted_images"] += 1
                stats["skipped_images"] += 1
                continue
                
            annos = img_annos[img_id]
            if not annos:
                stats["missing_labels"] += 1
                continue
                
            img_width = img_info['width']
            img_height = img_info['height']
            
            yolo_lines = []
            for ann in annos:
                bbox = ann['bbox'] # [x,y,width,height] top-left
                x_tl, y_tl, w, h = bbox
                
                # convert to yolo
                x_c = (x_tl + w / 2.0) / img_width
                y_c = (y_tl + h / 2.0) / img_height
                w_n = w / img_width
                h_n = h / img_height
                
                # clip
                x_c = max(0.0, min(1.0, x_c))
                y_c = max(0.0, min(1.0, y_c))
                w_n = max(0.0, min(1.0, w_n))
                h_n = max(0.0, min(1.0, h_n))
                
                if w_n > 0 and h_n > 0:
                    yolo_lines.append(f"0 {x_c:.6f} {y_c:.6f} {w_n:.6f} {h_n:.6f}")
                else:
                    stats["invalid_yolo_coordinates"] += 1
                    
            if not yolo_lines:
                stats["missing_labels"] += 1
                continue
                
            # Create a virtual label item for TACO
            base_name = "taco_" + str(img_id)
            dataset_items.append({
                "source": "taco",
                "base_name": base_name,
                "img_path": img_path,
                "yolo_lines": yolo_lines
            })

    stats["images_processed"] = len(dataset_items)
    
    # Shuffle and split
    random.seed(42)
    random.shuffle(dataset_items)
    
    n_total = len(dataset_items)
    n_train = int(0.8 * n_total)
    n_val = int(0.1 * n_total)
    
    splits_assign = []
    splits_assign.extend(['train'] * n_train)
    splits_assign.extend(['val'] * n_val)
    splits_assign.extend(['test'] * (n_total - n_train - n_val))
    
    # Detect duplicates
    seen_bases = set()
    
    for i, item in enumerate(dataset_items):
        base = item["base_name"]
        if base in seen_bases:
            stats["duplicate_filenames"] += 1
            continue
        seen_bases.add(base)
        
        split = splits_assign[i]
        stats["split_counts"][split] += 1
        
        # Copy image
        dst_img = os.path.join(final_base, "images", split, base + ".jpg")
        shutil.copy2(item["img_path"], dst_img)
        
        # Copy or write label
        dst_lbl = os.path.join(final_base, "labels", split, base + ".txt")
        lines = []
        if item["source"] == "rdd":
            shutil.copy2(item["lbl_path"], dst_lbl)
            with open(item["lbl_path"], "r") as f:
                lines = [l.strip() for l in f.readlines() if l.strip()]
        else: # taco
            lines = item["yolo_lines"]
            with open(dst_lbl, "w") as f:
                f.write("\n".join(lines) + "\n")
                
        # Count classes
        for line in lines:
            parts = line.split()
            if not parts:
                continue
            cls_id = int(parts[0])
            stats["bounding_boxes_total"] += 1
            if cls_id == 0:
                stats["class_counts"]["0_Garbage"] += 1
            elif cls_id == 1:
                stats["class_counts"]["1_Pothole"] += 1
            elif cls_id == 3:
                stats["class_counts"]["3_Road_Damage"] += 1
                
        stats["images_converted"] += 1
        
    # Generate data.yaml
    yaml_path = os.path.join(final_base, "data.yaml")
    with open(yaml_path, "w") as f:
        f.write("path: ./  # Dataset root dir (relative to yolo runs)\n")
        f.write("train: images/train\n")
        f.write("val: images/val\n")
        f.write("test: images/test\n\n")
        f.write("names:\n")
        f.write("  0: Garbage\n")
        f.write("  1: Pothole\n")
        f.write("  3: Road Damage\n")
        
    # Write report
    report_path = os.path.join(final_base, "dataset_report.json")
    report_content = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "images_processed": stats["images_processed"],
        "images_converted": stats["images_converted"],
        "class_counts": stats["class_counts"],
        "split_counts": stats["split_counts"],
        "bounding_boxes_total": stats["bounding_boxes_total"],
        "validation_results": {
            "missing_labels": stats["missing_labels"],
            "duplicate_filenames": stats["duplicate_filenames"],
            "corrupted_images": stats["corrupted_images"],
            "invalid_yolo_coordinates": stats["invalid_yolo_coordinates"]
        }
    }
    with open(report_path, "w") as f:
        json.dump(report_content, f, indent=4)
        
    print(json.dumps(report_content, indent=4))
    
if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    merge_datasets()
