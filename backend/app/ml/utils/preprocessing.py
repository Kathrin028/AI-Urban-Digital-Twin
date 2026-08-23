from app.ml.config import COMPLAINT_CATEGORIES

def validate_category(category: str) -> bool:
    return category in COMPLAINT_CATEGORIES

def normalize_category(category: str) -> str:
    # Capitalize and trim
    return category.strip().title()

def validate_coordinates(lat: float, lon: float) -> bool:
    return -90 <= lat <= 90 and -180 <= lon <= 180
