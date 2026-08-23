# ML configuration and taxonomy

# YOLOv8 Configuration
YOLO_CONFIDENCE_THRESHOLD = 0.50
YOLO_NMS_THRESHOLD = 0.45

COMPLAINT_CATEGORIES = [
    "Garbage",
    "Pothole",
    "Streetlight",
    "Water Leakage",
    "Road Damage",
    "Drainage"
]

YOLO_DETECTABLE_CATEGORIES = [
    "Garbage",
    "Pothole",
    "Water Leakage",
    "Road Damage",
    "Drainage"
]

PRIORITY_LEVELS = [
    "Low",
    "Medium",
    "High"
]

STATUS_VALUES = [
    "Pending",
    "In Progress",
    "Resolved"
]
