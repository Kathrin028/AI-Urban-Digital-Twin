import os
import argparse
import xml.etree.ElementTree as ET

# UrbanMind Mappings
# D00 -> 3 (Road Damage)
# D10 -> 3 (Road Damage)
# D20 -> 3 (Road Damage)
# D40 -> 1 (Pothole)

CLASS_MAPPING = {
    "D00": 3,
    "D10": 3,
    "D20": 3,
    "D40": 1
}

def convert_voc_to_yolo(xml_path, img_width, img_height):
    """
    Converts Pascal VOC bounding boxes to YOLO normalized format.
    YOLO format: <class_id> <x_center> <y_center> <width> <height>
    """
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        
        yolo_labels = []
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
            
            # Convert to YOLO (normalized)
            x_center = ((xmin + xmax) / 2.0) / img_width
            y_center = ((ymin + ymax) / 2.0) / img_height
            width = (xmax - xmin) / img_width
            height = (ymax - ymin) / img_height
            
            # Ensure bounds
            x_center = max(0.0, min(1.0, x_center))
            y_center = max(0.0, min(1.0, y_center))
            width = max(0.0, min(1.0, width))
            height = max(0.0, min(1.0, height))
            
            yolo_labels.append(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}")
            
        return yolo_labels
    except Exception as e:
        print(f"Error parsing XML {xml_path}: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="Convert RDD2022 Pascal VOC XML to YOLO format")
    parser.add_argument("--source", type=str, help="Source directory containing RDD2022")
    parser.add_argument("--dest", type=str, help="Destination directory for YOLO labels")
    args = parser.parse_args()
    
    print("--- UrbanMind AI: RDD2022 to YOLO Conversion Utility ---")
    print("Note: This script is a utility and is NOT executed automatically during step 2D.")
    print("Run this during the dataset normalization phase (Step 2C/2E).")
    
if __name__ == "__main__":
    main()
