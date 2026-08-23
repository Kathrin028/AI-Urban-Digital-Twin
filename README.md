# UrbanMind AI
**AI-Powered Urban Digital Twin for Civic Issue Prediction and Smart Complaint Management**

## Project Overview
UrbanMind AI is a comprehensive, production-ready civic technology platform that transforms how municipalities manage public infrastructure issues. It empowers citizens to report issues like potholes or structural damage via a seamless interface and provides city administrators with a powerful AI-driven digital twin dashboard to triage, analyze, and resolve complaints efficiently.

## Authors
- UrbanMind AI Engineering Team

## License
MIT License

## Key Capabilities
- YOLOv8 road/civic issue detection
- Random Forest priority prediction
- K-Means hotspot clustering
- Explainable AI priority factors
- AI-assisted recommended action
- Duplicate complaint detection
- Area-wise analytics
- Before-vs-after hotspot analysis
- Digital Twin visualization
- Notifications
- CSV/PDF exports
- Profile management
- Security and role-based access

---

## 1. Architecture Diagram
```mermaid
graph TD;
    Client[React Frontend - Vite + Tailwind] -->|REST API / JWT| Gateway[FastAPI Backend]
    Gateway --> Auth[Auth Service]
    Gateway --> Complaints[Complaint Service]
    Gateway --> AI[AI Pipeline]
    
    AI --> YOLO[YOLOv8 Damage Detection]
    AI --> RF[Random Forest Priority]
    AI --> KMeans[K-Means Clustering]
    
    Complaints --> DB[(MongoDB Database)]
    Auth --> DB
    KMeans --> DB
```

## 2. System Flow Diagram
```mermaid
sequenceDiagram
    participant Citizen
    participant Frontend
    participant Backend
    participant AI
    participant Admin
    
    Citizen->>Frontend: Report issue & upload photo
    Frontend->>Backend: POST /api/complaints
    Backend->>AI: Image Inference (YOLO)
    AI-->>Backend: Bounding boxes & category
    Backend->>AI: Priority Prediction (Random Forest)
    AI-->>Backend: Priority score
    Backend-->>Frontend: Complaint saved
    Frontend-->>Citizen: Success Toast Notification
    
    Admin->>Frontend: View Dashboard
    Frontend->>Backend: GET Analytics & Hotspots
    Backend->>AI: Run K-Means Clustering
    AI-->>Backend: Cluster coordinates
    Backend-->>Frontend: Analytics data
    Frontend-->>Admin: Interactive Digital Twin Map
```

## 3. Database ER Diagram (MongoDB Collections)
```mermaid
erDiagram
    USERS {
        ObjectId _id PK
        String email
        String password_hash
        String name
        String role "citizen/admin"
        String phone
        String profile_photo
    }
    COMPLAINTS {
        ObjectId _id PK
        String user_id FK
        String category
        String description
        Object location "lat/lng"
        String status "Pending/In Progress/Resolved"
        String priority
        Object ai_prediction "confidence, bounding_boxes, model_name"
        String image_url
        DateTime created_at
    }
    USERS ||--o{ COMPLAINTS : reports
```

## 4. AI Workflow Diagram
```mermaid
flowchart LR
    A[Image Upload] --> B{YOLOv8 Model}
    B -->|Damage Found| C[Extract Bounding Boxes & Confidence]
    B -->|No Damage| D[Fallback Category]
    
    C --> E{Random Forest Model}
    D --> E
    
    E -->|Age, Repeated, Confidence| F[Assign Priority Level]
    F --> G[Save to MongoDB]
```

## 5. Folder Structure Diagram
```mermaid
graph TD
    Root[AI-Urban-Digital-Twin]
    Root --> Backend[backend/]
    Root --> Frontend[frontend/]
    
    Backend --> App[app/]
    App --> ML[ml/]
    App --> Routes[routes/]
    App --> Database[database/]
    Backend --> Models[models/]
    Models --> Detection[detection/yolov1]
    Models --> Priority[priority/random_forest.pkl]
    
    Frontend --> Src[src/]
    Src --> Components[components/]
    Components --> DigitalTwin[digitalTwin/]
    Src --> Pages[pages/]
    Src --> Contexts[contexts/]
```

---

## Installation & Deployment Guide

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MongoDB Community Server (Running on `localhost:27017`)

### Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8005
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Production Build
```bash
cd frontend
npm run build
# Dist folder will be generated for static hosting (e.g. Nginx, Vercel)
```

## Known Limitations
- The PDF Export functionality relies on client-side browser memory (`jspdf`). Extremely large datasets (>10,000 rows) may cause memory issues on lower-end devices.
- YOLO inference runs on CPU by default. For production deployments with high traffic, a GPU-enabled PyTorch environment is recommended.
- Current K-Means clustering does not factor in time-decay.

## Future Scope
- **Time-Series Hotspots**: Upgrade clustering to factor in the resolution time of complaints, letting clusters naturally dissipate as issues are fixed.
- **GPU Acceleration**: Deploy YOLOv8 with TensorRT or ONNX for real-time edge processing.
- **Push Notifications**: Integrate Firebase Cloud Messaging (FCM) or WebSockets for real-time admin alerts.
