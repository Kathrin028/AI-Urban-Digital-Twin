import os
import argparse
import xml.etree.ElementTree as ET

def validate_rdd2022(dataset_path):
    print("--- UrbanMind AI: RDD2022 Validator ---")
    print(f"Checking dataset path: {dataset_path}")
    
    if not os.path.exists(dataset_path):
        print(f"Error: Path {dataset_path} does not exist.")
        return

    countries = [d for d in os.listdir(dataset_path) if os.path.isdir(os.path.join(dataset_path, d))]
    print(f"Countries found: {countries}")

    total_images = 0
    total_xmls = 0
    missing_labels = 0
    corrupted_images = 0
    unknown_classes = set()
    valid_classes = {"D00", "D10", "D20", "D40"}
    invalid_boxes = 0

    for country in countries:
        country_path = os.path.join(dataset_path, country)
        images_dir = os.path.join(country_path, 'train', 'images')
        annotations_dir = os.path.join(country_path, 'train', 'annotations', 'xmls')
        
        if not os.path.exists(images_dir) or not os.path.exists(annotations_dir):
            continue
            
        images = [f for f in os.listdir(images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        total_images += len(images)
        
        for img_file in images:
            base_name = os.path.splitext(img_file)[0]
            xml_file = os.path.join(annotations_dir, f"{base_name}.xml")
            
            # Check if XML exists
            if not os.path.exists(xml_file):
                missing_labels += 1
                continue
                
            total_xmls += 1
            
            # Parse XML
            try:
                tree = ET.parse(xml_file)
                root = tree.getroot()
                
                size = root.find('size')
                if size is not None:
                    width = int(size.find('width').text)
                    height = int(size.find('height').text)
                else:
                    width = height = 0
                    
                for obj in root.findall('object'):
                    name = obj.find('name').text
                    if name not in valid_classes:
                        unknown_classes.add(name)
                        
                    bndbox = obj.find('bndbox')
                    if bndbox is not None:
                        xmin = float(bndbox.find('xmin').text)
                        ymin = float(bndbox.find('ymin').text)
                        xmax = float(bndbox.find('xmax').text)
                        ymax = float(bndbox.find('ymax').text)
                        
                        if xmin < 0 or ymin < 0 or xmax <= xmin or ymax <= ymin or (width > 0 and (xmax > width or ymax > height)):
                            invalid_boxes += 1
                            
            except Exception as e:
                # Malformed XML or file error
                corrupted_images += 1
                
    print("\n--- Summary ---")
    print(f"Total Images: {total_images}")
    print(f"Total XMLs: {total_xmls}")
    print(f"Missing Labels: {missing_labels}")
    print(f"Corrupted/Unreadable XMLs: {corrupted_images}")
    print(f"Invalid Bounding Boxes: {invalid_boxes}")
    print(f"Unknown Classes Encountered: {unknown_classes}")
    
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate RDD2022 Dataset")
    parser.add_argument("--dataset_path", type=str, default="../ml_data/yolo/source/rdd2022", help="Path to RDD2022 dataset root")
    args = parser.parse_args()
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.abspath(os.path.join(script_dir, args.dataset_path))
    
    validate_rdd2022(dataset_path)
