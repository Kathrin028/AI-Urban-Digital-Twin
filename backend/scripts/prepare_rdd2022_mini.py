import os
import shutil
import random
import xml.etree.ElementTree as ET
from collections import defaultdict
import json

def prepare_mini_dataset():
    source_base = "../ml_data/yolo/source/rdd2022/RDD2022_India/India/train"
    dest_base = "../ml_data/yolo/mini_dataset/rdd2022"
    
    img_dir = os.path.join(source_base, "images")
    xml_dir = os.path.join(source_base, "annotations", "xmls")
    
    dest_img_dir = os.path.join(dest_base, "images")
    dest_xml_dir = os.path.join(dest_base, "annotations", "xmls")
    
    os.makedirs(dest_img_dir, exist_ok=True)
    os.makedirs(dest_xml_dir, exist_ok=True)
    
    if not os.path.exists(img_dir) or not os.path.exists(xml_dir):
        print(f"Source directories not found: {img_dir} or {xml_dir}")
        return

    images = [f for f in os.listdir(img_dir) if f.lower().endswith('.jpg')]
    print(f"Total images scanned: {len(images)}")
    
    valid_pairs = []
    class_counts_total = defaultdict(int)
    image_class_mapping = defaultdict(list)
    missing_xmls = 0
    invalid_xmls = 0

    for img in images:
        base = os.path.splitext(img)[0]
        xml_file = base + ".xml"
        xml_path = os.path.join(xml_dir, xml_file)
        
        if not os.path.exists(xml_path):
            missing_xmls += 1
            continue
            
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            classes_in_img = set()
            for obj in root.findall('object'):
                name = obj.find('name').text
                if name in ["D00", "D10", "D20", "D40"]:
                    classes_in_img.add(name)
                    class_counts_total[name] += 1
            
            if classes_in_img:
                valid_pairs.append(base)
                for cls in classes_in_img:
                    image_class_mapping[cls].append(base)
        except Exception:
            invalid_xmls += 1
            
    print(f"Total valid image/XML pairs with target classes: {len(valid_pairs)}")
    print(f"Missing XMLs: {missing_xmls}")
    print(f"Invalid XMLs: {invalid_xmls}")
    print(f"Total class counts in source: {dict(class_counts_total)}")

    # Deterministic selection for balance (up to 1000 images)
    random.seed(42)
    selected = set()
    
    # Try to pick 250 from each of the 4 classes to get ~1000 images
    target_per_class = 250
    
    for cls in ["D00", "D10", "D20", "D40"]:
        pool = [b for b in image_class_mapping[cls] if b not in selected]
        k = min(target_per_class, len(pool))
        chosen = random.sample(pool, k)
        selected.update(chosen)
        
    # If we are short of 800, randomly sample from remaining valid_pairs
    if len(selected) < 800:
        remaining = [b for b in valid_pairs if b not in selected]
        shortfall = 800 - len(selected)
        k = min(shortfall, len(remaining))
        chosen = random.sample(remaining, k)
        selected.update(chosen)
        
    print(f"Images selected for mini dataset: {len(selected)}")
    
    class_counts_selected = defaultdict(int)
    for base in selected:
        img_src = os.path.join(img_dir, base + ".jpg")
        xml_src = os.path.join(xml_dir, base + ".xml")
        img_dst = os.path.join(dest_img_dir, base + ".jpg")
        xml_dst = os.path.join(dest_xml_dir, base + ".xml")
        
        shutil.copy2(img_src, img_dst)
        shutil.copy2(xml_src, xml_dst)
        
        tree = ET.parse(xml_dst)
        root = tree.getroot()
        for obj in root.findall('object'):
            name = obj.find('name').text
            if name in ["D00", "D10", "D20", "D40"]:
                class_counts_selected[name] += 1
                
    print(f"Class distribution in mini dataset: {dict(class_counts_selected)}")
    
    report = {
        "Total images scanned": len(images),
        "Total valid image/XML pairs": len(valid_pairs),
        "Images selected": len(selected),
        "Class distribution selected": dict(class_counts_selected),
        "Images skipped": len(images) - len(selected)
    }
    
    with open(os.path.join(dest_base, "report.json"), "w") as f:
        json.dump(report, f, indent=4)
        
if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    prepare_mini_dataset()
