from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

def get_preprocessor():
    """
    Creates and returns the scikit-learn preprocessing pipeline.
    Handles categorical encoding, missing values, and scaling.
    """
    
    # Categorical Features
    categorical_features = ["category"]
    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
        ("onehot", OneHotEncoder(handle_unknown="ignore"))
    ])
    
    # Numerical Features that need scaling (e.g. counts, age)
    numerical_features = [
        "yolo_confidence", 
        "bounding_box_count", 
        "complaint_age_days", 
        "repeat_complaint_count", 
        "image_exists"
    ]
    numerical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    # Combine all preprocessing steps
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_transformer, numerical_features),
            ("cat", categorical_transformer, categorical_features)
        ]
    )
    
    return preprocessor
