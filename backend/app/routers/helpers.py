import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.helper import Helper
from app.schemas.helper import HelperResponse

router = APIRouter(prefix="/api/helpers", tags=["helper-network"])


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return r * 2 * math.asin(math.sqrt(a))


@router.get("/nearby", response_model=list[HelperResponse])
def nearby_helpers(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(5.0, gt=0, le=100),
    db: Session = Depends(get_db),
):
    helpers = db.query(Helper).filter(Helper.available.is_(True)).all()
    results = []
    for h in helpers:
        distance = _haversine_km(lat, lng, h.latitude, h.longitude)
        if distance <= radius_km:
            item = HelperResponse.model_validate(h)
            item.distance_km = round(distance, 2)
            results.append(item)
    results.sort(key=lambda h: h.distance_km)
    return results
