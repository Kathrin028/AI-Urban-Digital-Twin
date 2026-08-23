# UrbanMind AI - Setup & Environment Guide

## Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MongoDB Community Server (Running on `localhost:27017` or Atlas equivalent)

## Backend Setup
1. Open terminal and navigate to `backend/`.
2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create `.env` file in the `backend/` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017
   DATABASE_NAME=urbanmind_db
   JWT_SECRET=supersecretjwtkey_12345
   PORT=8005
   ```
5. Seed Admin User (Optional):
   ```bash
   python scripts/seed_admin.py
   ```
6. Start Server:
   ```bash
   uvicorn app.main:app --reload --port 8005
   ```

## Frontend Setup
1. Open terminal and navigate to `frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```

The application will be accessible at `http://localhost:5173`.
