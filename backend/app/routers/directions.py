from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.directions import DirectionsResponse
from app.services.directions import fetch_shortest_path

router = APIRouter(prefix="/api/directions", tags=["directions"])


@router.get("", response_model=DirectionsResponse)
def get_directions(
    from_lat: float = Query(...),
    from_lng: float = Query(...),
    to_lat: float = Query(...),
    to_lng: float = Query(...),
    profile: str = Query("foot", pattern="^(foot|bike|car)$"),
):
    result = fetch_shortest_path(from_lat, from_lng, to_lat, to_lng, profile)
    if result is None:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not compute a route")
    return result
