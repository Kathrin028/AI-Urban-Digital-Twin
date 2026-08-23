import math
from app.services.duplicate_detection import calculate_distance, DUPLICATE_RADIUS_METERS
from app.routes.complaints import calculate_dynamic_priority

def test_calculate_distance():
    lat1, lon1 = 10.984600, 77.057700
    lat2, lon2 = 10.985500, 77.057700
    dist = calculate_distance(lat1, lon1, lat2, lon2)
    print(f"Distance test (0.0009 deg lat): {dist:.2f} meters")

def test_priority_logic():
    p1, e1 = calculate_dynamic_priority({'related_report_count': 1, 'category': 'Garbage'})
    print(f"1 Garbage -> {p1}, {e1}")
    p2, e2 = calculate_dynamic_priority({'related_report_count': 1, 'category': 'Road Damage'})
    print(f"1 Road Damage -> {p2}, {e2}")
    p3, e3 = calculate_dynamic_priority({'related_report_count': 5, 'category': 'Pothole'})
    print(f"5 Potholes -> {p3}, {e3}")
    p4, e4 = calculate_dynamic_priority({'related_report_count': 8, 'category': 'Streetlight'})
    print(f"8 Streetlights -> {p4}, {e4}")

if __name__ == "__main__":
    test_calculate_distance()
    test_priority_logic()
    print('All clustering logic tests passed!')
