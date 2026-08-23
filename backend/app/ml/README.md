# UrbanMind AI ML Architecture

This package is the foundation for all AI and ML inference in the UrbanMind AI platform.

## Architecture Structure

- `detection/`: YOLOv8 based object detection for civic issues.
- `priority/`: Random Forest (or similar) algorithm for prioritizing complaints based on context, detection confidence, and severity.
- `clustering/`: K-Means clustering algorithm for geospatial hotspot detection.
- `utils/`: Data preprocessing, schema normalization, and spatial utilities.

## Separation of Concerns

* No ML models are trained inside this directory.
* This directory contains INFERENCE code, configurations, and API interfaces only.
* Raw datasets and training scripts live in `backend/ml_data`.
* Saved models (.pt, .joblib, etc.) live in `backend/models`.

## Phase 4 Step 2 Status

* Ultralytics is installed.
* `CivicIssueDetector` interface is ready and gracefully handles a missing model.
* **BLOCKED**: We lack a fully verified, annotated, and correctly licensed civic dataset to begin training. No model training was executed yet.
