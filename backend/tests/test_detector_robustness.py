import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
import numpy as np
from PIL import Image
from pathlib import Path
from app.ml.detection.detector import detector, nms, nms_multiclass, CLASS_MAPPING, CLASS_THRESHOLDS

MODEL_PATH = Path(__file__).parent.parent / "models" / "detection" / "urbanmind_yolov1" / "weights" / "best.onnx"

@pytest.fixture(scope="module", autouse=True)
def load_detector_model():
    if not detector.is_available():
        detector.load_model(str(MODEL_PATH))
    assert detector.is_available(), "Failed to load YOLO ONNX detector model for testing"

def test_nms_zero_division_and_nan_safety():
    """Verify that NMS never throws ZeroDivisionError or produces NaNs on degenerate boxes."""
    # 1. Empty boxes
    empty_boxes = np.empty((0, 4), dtype=np.float32)
    empty_scores = np.empty((0,), dtype=np.float32)
    assert nms(empty_boxes, empty_scores) == []

    # 2. Zero-area boxes (x1 == x2 or y1 == y2)
    degen_boxes = np.array([
        [10.0, 10.0, 10.0, 50.0],  # zero width
        [20.0, 20.0, 50.0, 20.0],  # zero height
        [30.0, 30.0, 30.0, 30.0],  # point box
    ], dtype=np.float32)
    degen_scores = np.array([0.9, 0.8, 0.7], dtype=np.float32)
    res = nms(degen_boxes, degen_scores)
    assert res == [], "Degenerate zero-area boxes must not survive NMS"

    # 3. Multi-class NMS with degenerate and valid boxes mixed
    mixed_boxes = np.array([
        [10.0, 10.0, 10.0, 50.0],  # degenerate
        [10.0, 10.0, 60.0, 60.0],  # valid box 1
        [12.0, 12.0, 58.0, 58.0],  # duplicate overlapping box 1
        [100.0, 100.0, 150.0, 150.0], # valid box 2
    ], dtype=np.float32)
    mixed_scores = np.array([0.95, 0.85, 0.80, 0.75], dtype=np.float32)
    class_ids = np.array([0, 0, 0, 3], dtype=int)
    keep = nms_multiclass(mixed_boxes, mixed_scores, class_ids, iou_threshold=0.45)
    assert 0 not in keep, "Degenerate box must be rejected"
    assert 1 in keep, "Highest confidence box 1 must be kept"
    assert 2 not in keep, "Duplicate overlapping box 1 must be suppressed by NMS"
    assert 3 in keep, "Distinct class 3 box must be preserved across multi-class NMS"

def test_dynamic_padding_suppression(tmp_path):
    """Ensure non-square letterboxed images do not produce false alarms in gray padding margins."""
    # Create an extreme aspect ratio image (800x100) where >65% of the 320x320 canvas is padding
    img = Image.new("RGB", (800, 100), (120, 120, 120))
    img_path = tmp_path / "extreme_aspect_ratio.jpg"
    img.save(str(img_path))

    res = detector.predict(str(img_path))
    assert res["available"] is True
    # If any proposals are detected, verify their unpadded coordinates are strictly within the image
    for b in res.get("bounding_boxes", []):
        x1, y1, x2, y2 = b["box"]
        assert 0 <= x1 <= 800, f"Box x1 out of bounds: {x1}"
        assert 0 <= x2 <= 800, f"Box x2 out of bounds: {x2}"
        assert 0 <= y1 <= 100, f"Box y1 out of bounds: {y1}"
        assert 0 <= y2 <= 100, f"Box y2 out of bounds: {y2}"
        assert (x2 - x1) >= 4.0, "Box width must be >= 4px"
        assert (y2 - y1) >= 4.0, "Box height must be >= 4px"

def test_negative_control_images_rejection():
    """Verify that clean/unrelated images with no civic damage do not produce false alarms."""
    fixture_dir = Path(__file__).parent / "fixtures" / "negative_controls"
    clean_images = [
        "neg_clean_road_lane.jpg",
        "neg_clean_park_sky.jpg",
        "neg_clean_indoor_wall.jpg",
        "neg_clean_tile_floor.jpg",
        "neg_solid_neutral_gray.jpg",
        "neg_solid_black.jpg",
        "neg_solid_sky_blue.jpg",
        "neg_solid_white.jpg"
    ]
    for fn in clean_images:
        fp = fixture_dir / fn
        if fp.exists():
            res = detector.predict(str(fp))
            assert res["available"] is True
            assert res["category"] is None, f"Expected None for negative control {fn}, got {res['category']}"
            assert res["confidence"] == 0, f"Expected 0 confidence for {fn}, got {res['confidence']}"
            assert res["bounding_boxes"] == [], f"Expected empty boxes for {fn}"

def test_hero_asset_rejection():
    """Verify that Hero.png (which previously triggered padding boundary Road Damage) is clean."""
    hero_path = Path(__file__).parent.parent.parent / "frontend" / "src" / "assets" / "images" / "Hero.png"
    if hero_path.exists():
        res = detector.predict(str(hero_path))
        assert res["available"] is True
        assert res["category"] is None, f"Hero.png must not trigger Road Damage false alarm: {res}"
        assert res["confidence"] == 0

def test_target_garbage_images():
    """Verify detection on the three representative garbage complaint images."""
    uploads_dir = Path(__file__).parent.parent / "uploads" / "complaints"

    # Garbage Image 1 (previously dropped by 0.10 threshold)
    g1 = uploads_dir / "6a8085eb8848b02a43e6c807_2b0bb1089a394164b9674fadee70e99b.jpg"
    if g1.exists():
        res1 = detector.predict(str(g1))
        assert res1["category"] == "Garbage", f"Garbage 1 expected 'Garbage', got {res1['category']}"
        assert res1["confidence"] >= CLASS_THRESHOLDS[0]

    # Garbage Image 2 (previously misclassified as Road Damage due to padding & asphalt)
    g2 = uploads_dir / "6a89b321a76b2fee4ae74edd_4119e77b84714c9fbc402bd9dd99110d.jpg"
    if g2.exists():
        res2 = detector.predict(str(g2))
        assert res2["category"] == "Garbage", f"Garbage 2 expected 'Garbage', got {res2['category']}"
        assert res2["confidence"] >= CLASS_THRESHOLDS[0]

    # Garbage Image 3 (previously correctly classified)
    g3 = uploads_dir / "6a89a17462d94c86c7f85c58_963f3fb953104067a046b5fc04200e32.jpg"
    if g3.exists():
        res3 = detector.predict(str(g3))
        assert res3["category"] == "Garbage", f"Garbage 3 expected 'Garbage', got {res3['category']}"
        assert res3["confidence"] >= CLASS_THRESHOLDS[0]

def test_target_road_damage_images():
    """Verify detection on genuine Road Damage and Pothole test images."""
    uploads_dir = Path(__file__).parent.parent / "uploads" / "complaints"
    rd1 = uploads_dir / "6a8085c38848b02a43e6c806_eeecdfed54244074abaa3fd3c75ea423.jpg"
    if rd1.exists():
        res1 = detector.predict(str(rd1))
        assert res1["category"] == "Road Damage", f"Road Damage 1 expected 'Road Damage', got {res1['category']}"
        assert res1["confidence"] >= CLASS_THRESHOLDS[3]

    # Genuine surface cracks from dataset
    rd_cracks = Path(__file__).parent.parent / "ml_data" / "yolo" / "final_dataset" / "images" / "test" / "rdd_India_000874.jpg"
    if rd_cracks.exists():
        res2 = detector.predict(str(rd_cracks))
        assert res2["category"] == "Road Damage", f"rdd_India_000874 expected 'Road Damage', got {res2['category']}"
        assert res2["confidence"] >= CLASS_THRESHOLDS[3]

    # Genuine pothole from dataset
    rd_pothole = Path(__file__).parent.parent / "ml_data" / "yolo" / "final_dataset" / "images" / "test" / "rdd_India_002379.jpg"
    if rd_pothole.exists():
        res3 = detector.predict(str(rd_pothole))
        assert res3["category"] == "Pothole", f"rdd_India_002379 expected 'Pothole', got {res3['category']}"
        assert res3["confidence"] >= CLASS_THRESHOLDS[1]

def test_invalid_and_corrupt_images(tmp_path):
    """Verify graceful handling of non-existent and corrupted image inputs."""
    # 1. Non-existent file
    res_missing = detector.predict(str(tmp_path / "non_existent.jpg"))
    assert res_missing["available"] is False
    assert "inference_error" in res_missing.get("reason", "")

    # 2. Corrupt truncated file
    corrupt_file = tmp_path / "corrupt.jpg"
    corrupt_file.write_bytes(b"NOT_A_VALID_JPEG_HEADER_12345")
    res_corrupt = detector.predict(str(corrupt_file))
    assert res_corrupt["available"] is False
    assert "inference_error" in res_corrupt.get("reason", "")
