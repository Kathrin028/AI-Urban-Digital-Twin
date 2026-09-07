from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import health, auth, complaints, admin, users, departments
from fastapi.staticfiles import StaticFiles
from app.database.connection import connect_to_mongo, close_mongo_connection
import os
from pathlib import Path

from app.ml.detection.detector import detector

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    
    # Load YOLO model
    model_path = Path(__file__).parent.parent / "models" / "detection" / "urbanmind_yolov1" / "weights" / "best.pt"
    detector.load_model(str(model_path))
    
    # Load Priority Model
    from app.ml.priority.predictor import priority_predictor
    rf_model_path = Path(__file__).parent.parent / "models" / "priority" / "random_forest.pkl"
    priority_predictor.load_model(str(rf_model_path))
    
    # Seed Departments safely
    from app.database.seeder import seed_departments
    await seed_departments()
    
    yield
    await close_mongo_connection()

app = FastAPI(
    title=settings.app_name,
    description="Backend API for UrbanMind AI civic issue management platform.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(complaints.router, prefix="/api/complaints", tags=["complaints"])
app.include_router(departments.router, prefix="/api/admin/departments", tags=["departments"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(health.router, prefix="/api/health", tags=["health"])

# Mount static files for uploads
import os
os.makedirs("uploads/complaints", exist_ok=True)
app.mount("/uploads/complaints", StaticFiles(directory="uploads/complaints"), name="complaint_uploads")

os.makedirs("uploads/profiles", exist_ok=True)
app.mount("/uploads/profiles", StaticFiles(directory="uploads/profiles"), name="profile_uploads")

@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }
