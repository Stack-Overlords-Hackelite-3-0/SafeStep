from fastapi import APIRouter, Query

from app.schemas.public_place import PublicPlaceResponse
from app.services.public_places import fetch_nearby_public_places

router = APIRouter(prefix="/api/public-places", tags=["public-places"])


@router.get("/nearby", response_model=list[PublicPlaceResponse])
def nearby_public_places(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(5.0, gt=0, le=20),
):
    return fetch_nearby_public_places(lat, lng, radius_km)
