# UrbanMind AI - API Documentation

## Authentication
`POST /api/auth/register`
- Registers a new user. Expects `email`, `password`, `name`.

`POST /api/auth/login`
- Authenticates a user and returns a JWT token. Expects `username` (email) and `password`.

## User Profile
`GET /api/users/profile`
- Retrieves the current authenticated user's profile details.
- **Headers**: Authorization: Bearer <token>

`PATCH /api/users/profile`
- Updates user profile. Can include `name`, `phone`, and `profile_photo` as multipart/form-data.
- **Headers**: Authorization: Bearer <token>

## Complaints
`POST /api/complaints/`
- Creates a new complaint.
- **Body**: category, description, location.
- **Headers**: Authorization: Bearer <token>

`POST /api/complaints/{id}/image`
- Uploads an image as evidence for a complaint and triggers the AI YOLOv8 model for inference.

`GET /api/complaints/my`
- Fetches complaints reported by the logged-in citizen.

`GET /api/complaints/`
- (Admin Only) Fetches all complaints with optional query parameters for filtering (`status`, `category`, `priority`, `search`).

`PATCH /api/complaints/{id}/status`
- (Admin Only) Updates the status of a complaint (`Pending`, `In Progress`, `Resolved`).

## Admin & Analytics
`GET /api/admin/dashboard/stats`
- Fetches real-time AI clustering analytics and statistics for the Smart Dashboard.

## Health
`GET /api/health`
- Returns API health status.
