from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.services.geocoding import geocode_address, reverse_geocode

router = APIRouter()

@router.get("/search")
async def search_locations(
    q: str = Query(..., min_length=2, description="Address or landmark to search"),
    limit: Optional[int] = Query(5, ge=1, le=10)
):
    try:
        results = geocode_address(q, limit=limit)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Geocoding service error: {str(e)}")

@router.get("/reverse")
async def reverse_geocode_location(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0)
):
    try:
        result = reverse_geocode(lat, lon)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reverse geocoding service error: {str(e)}")
