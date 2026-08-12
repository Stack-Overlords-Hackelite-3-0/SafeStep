from pydantic import BaseModel


class DirectionsResponse(BaseModel):
    distance_km: float
    duration_min: float
    coordinates: list[list[float]]  # [[lat, lng], ...] in travel order
