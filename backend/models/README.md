# UrbanMind AI Models

This directory stores compiled/trained model weights and serialized artifacts (e.g., `.pt`, `.joblib`, `.onnx`).

## Subdirectories
- `detection/`: Contains YOLOv8 `.pt` files.
- `priority/`: Contains Random Forest `.joblib` files.

**IMPORTANT Git Rules**:
- DO NOT commit large `.pt` or `.joblib` models to version control directly.
- Add model extensions to `.gitignore`.
- If a lightweight production model needs to be shipped, an explicit decision or a model registry (e.g., MLflow or HuggingFace) should be used instead.
