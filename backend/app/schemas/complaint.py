from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DuplicateCheckRequest(BaseModel):
    category: str
    latitude: float
    longitude: float
    description: Optional[str] = None

class LocationSchema(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None

class AIPredictionSchema(BaseModel):
    available: Optional[bool] = None
    category: Optional[str] = None
    confidence: Optional[float] = None
    bounding_boxes: Optional[list] = None
    priority: Optional[str] = None
    priority_confidence: Optional[float] = None
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    inference_time_ms: Optional[int] = None
    analyzed_at: Optional[str] = None
    # Keep old fields for backward compatibility if ever accessed
    severity: Optional[str] = None

class ComplaintCreate(BaseModel):
    category: str
    description: str
    location: LocationSchema
    imageName: Optional[str] = None
    image_url: Optional[str] = None
    image_metadata: Optional[dict] = None
    ai_prediction: Optional[AIPredictionSchema] = Field(None, alias="aiPrediction")
    evidence_verification_status: Optional[str] = "NOT_ANALYZED"

class ComplaintUpdate(BaseModel):
    status: str

class ComplaintAssign(BaseModel):
    department_id: str

class ProgressNoteCreate(BaseModel):
    note: str = Field(..., min_length=1, max_length=1000)

class ProgressNote(BaseModel):
    id: str
    note: str
    created_at: datetime
    created_by: str
    created_by_name: str
    department: str

class FieldEvidence(BaseModel):
    id: str
    file_url: str
    file_name: str
    uploaded_at: datetime
    uploaded_by: str
    uploaded_by_name: str
    department: str

class ComplaintResponse(BaseModel):
    id: str
    user_id: str
    category: str
    description: str
    location: LocationSchema
    imageName: Optional[str] = None
    image_url: Optional[str] = None
    image_metadata: Optional[dict] = None
    ai_prediction: Optional[AIPredictionSchema] = Field(None, alias="aiPrediction")
    status: str
    status_history: Optional[List[dict]] = None
    created_at: datetime
    updated_at: datetime
    is_primary: Optional[bool] = True
    is_duplicate: Optional[bool] = False
    duplicate_of: Optional[str] = None
    related_report_count: Optional[int] = 1
    evidence_verification_status: Optional[str] = "NOT_ANALYZED"
    priority: Optional[str] = None
    estimated_resolution: Optional[str] = None
    assigned_department: Optional[str] = None
    assigned_department_name: Optional[str] = None
    assigned_at: Optional[datetime] = None
    assigned_by: Optional[str] = None
    progress_notes: Optional[List[ProgressNote]] = None
    field_evidence: Optional[List[FieldEvidence]] = None

    class Config:
        populate_by_name = True
