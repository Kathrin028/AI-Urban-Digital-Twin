import os
import joblib
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

from app.ml.priority.dataset import PriorityDatasetManager
from app.ml.priority.features import get_preprocessor

async def train_priority_model():
    print("Initializing Priority Model Training...")
    
    # 1. Get Data
    dataset_manager = PriorityDatasetManager()
    df, source = await dataset_manager.get_training_data()
    print(f"Data Source: {source}")
    print(f"Dataset Size: {len(df)} samples")
    
    X = df.drop(columns=["priority"])
    y = df["priority"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 2. Build Pipeline
    preprocessor = get_preprocessor()
    rf = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight="balanced"
    )
    
    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", rf)
    ])
    
    # 3. Train
    print("Training Random Forest Classifier...")
    pipeline.fit(X_train, y_train)
    
    # 4. Evaluate
    y_pred = pipeline.predict(X_test)
    
    # Need zero_division=0 to handle cases where a class is missing in test set
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    
    print("\n--- Evaluation Metrics ---")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # 5. Feature Importance
    # Get feature names after preprocessing
    cat_encoder = pipeline.named_steps['preprocessor'].named_transformers_['cat'].named_steps['onehot']
    cat_features = cat_encoder.get_feature_names_out(["category"]).tolist()
    num_features = ["yolo_confidence", "bounding_box_count", "complaint_age_days", "repeat_complaint_count", "image_exists"]
    
    all_features = num_features + cat_features
    importances = pipeline.named_steps['classifier'].feature_importances_
    
    print("\n--- Feature Importances ---")
    fi_df = pd.DataFrame({"Feature": all_features, "Importance": importances})
    fi_df = fi_df.sort_values(by="Importance", ascending=False)
    for _, row in fi_df.iterrows():
        print(f"{row['Feature']:30} {row['Importance']:.4f}")
        
    # 6. Save Model
    models_dir = Path(__file__).parent.parent.parent.parent / "models" / "priority"
    models_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = models_dir / "random_forest.pkl"
    joblib.dump(pipeline, model_path)
    
    print(f"\nModel successfully saved to {model_path}")
    
    return {
        "source": source,
        "size": len(df),
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "feature_importances": fi_df.to_dict('records')
    }

if __name__ == "__main__":
    import asyncio
    # For local testing
    from app.database.connection import connect_to_mongo, close_mongo_connection
    async def run():
        await connect_to_mongo()
        await train_priority_model()
        await close_mongo_connection()
    asyncio.run(run())
