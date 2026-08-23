import os
import shutil
import xml.etree.ElementTree as ET
import json
import datetime

# UrbanMind Mappings
CLASS_MAPPING = {
    "D00": 3, # Road Damage
    "D10": 3,
    "D20": 3,
    "D40": 1  # Pothole
}

def convert_mini():
    source_base = "../ml_data/yolo/mini_dataset/rdd2022"
    dest_base = "../ml_data/yolo/mini_dataset/rdd2022_yolo"
    
    img_dir = os.path.join(source_base, "images")
    xml_dir = os.path.join(source_base, "annotations", "xmls")
    
    dest_img_dir = os.path.join(dest_base, "images")
    dest_lbl_dir = os.path.join(dest_base, "labels")
    
    os.makedirs(dest_img_dir, exist_ok=True)
    os.makedirs(dest_lbl_dir, exist_ok=True)
    
    images = [f for f in os.listdir(img_dir) if f.lower().endswith('.jpg')]
    
    stats = {
        "images_processed": len(images),
        "images_converted": 0,
        "conversion_failures": 0,
        "bounding_boxes_total": 0,
        "road_damage_count": 0,
        "pothole_count": 0,
        "skipped_images": 0,
        "skipped_xmls": 0,
        "missing_labels_after_conversion": 0,
        "invalid_normalized_coordinates": 0
    }
    
    for img_file in images:
        base_name = os.path.splitext(img_file)[0]
        xml_file = os.path.join(xml_dir, base_name + ".xml")
        img_src = os.path.join(img_dir, img_file)
        img_dst = os.path.join(dest_img_dir, img_file)
        txt_dst = os.path.join(dest_lbl_dir, base_name + ".txt")
        
        if not os.path.exists(xml_file):
            stats["skipped_images"] += 1
            stats["skipped_xmls"] += 1
            continue
            
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()
            
            size = root.find('size')
            if size is None:
                raise ValueError("Missing size tag")
            
            width = float(size.find('width').text)
            height = float(size.find('height').text)
            
            if width <= 0 or height <= 0:
                raise ValueError("Invalid image dimensions")
                
            yolo_lines = []
            for obj in root.findall('object'):
                name = obj.find('name').text
                if name not in CLASS_MAPPING:
                    continue
                    
                class_id = CLASS_MAPPING[name]
                
                bndbox = obj.find('bndbox')
                if bndbox is None:
                    continue
                    
                xmin = float(bndbox.find('xmin').text)
                ymin = float(bndbox.find('ymin').text)
                xmax = float(bndbox.find('xmax').text)
                ymax = float(bndbox.find('ymax').text)
                
                x_center = ((xmin + xmax) / 2.0) / width
                y_center = ((ymin + ymax) / 2.0) / height
                box_width = (xmax - xmin) / width
                box_height = (ymax - ymin) / height
                
                # Validation checks
                if not (0 <= x_center <= 1 and 0 <= y_center <= 1 and 0 < box_width <= 1 and 0 < box_height <= 1):
                    stats["invalid_normalized_coordinates"] += 1
                    # Clip if necessary or just ignore? Best to clip to [0,1]
                    x_center = max(0.0, min(1.0, x_center))
                    y_center = max(0.0, min(1.0, y_center))
                    box_width = max(0.0, min(1.0, box_width))
                    box_height = max(0.0, min(1.0, box_height))
                
                yolo_lines.append(f"{class_id} {x_center:.6f} {y_center:.6f} {box_width:.6f} {box_height:.6f}")
                stats["bounding_boxes_total"] += 1
                if class_id == 1:
                    stats["pothole_count"] += 1
                elif class_id == 3:
                    stats["road_damage_count"] += 1
                    
            if not yolo_lines:
                # No valid objects found (e.g. they were not target classes)
                stats["skipped_images"] += 1
                continue
                
            with open(txt_dst, 'w') as f:
                f.write("\n".join(yolo_lines) + "\n")
                
            shutil.copy2(img_src, img_dst)
            stats["images_converted"] += 1
            
        except Exception as e:
            print(f"Error processing {img_file}: {e}")
            stats["conversion_failures"] += 1
            stats["skipped_images"] += 1
            
    # Verification check across the final folders
    final_images = set([os.path.splitext(f)[0] for f in os.listdir(dest_img_dir) if f.endswith('.jpg')])
    final_labels = set([os.path.splitext(f)[0] for f in os.listdir(dest_lbl_dir) if f.endswith('.txt')])
    
    missing_labels = final_images - final_labels
    if missing_labels:
        stats["missing_labels_after_conversion"] = len(missing_labels)

    report_path = os.path.join(dest_base, "conversion_report.json")
    
    report_content = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "images_processed": stats["images_processed"],
        "images_converted": stats["images_converted"],
        "conversion_failures": stats["conversion_failures"],
        "bounding_boxes_total": stats["bounding_boxes_total"],
        "class_counts": {
            "3_Road_Damage": stats["road_damage_count"],
            "1_Pothole": stats["pothole_count"]
        },
        "skipped_images": stats["skipped_images"],
        "skipped_xmls": stats["skipped_xmls"]
    }
    
    with open(report_path, 'w') as f:
        json.dump(report_content, f, indent=4)
        
    print(json.dumps(stats, indent=4))
    
if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    convert_mini()
