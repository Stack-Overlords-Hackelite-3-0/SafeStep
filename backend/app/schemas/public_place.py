from pydantic import BaseModel


class PublicPlaceResponse(BaseModel):
    id: str
    name: str
    place_type: str
    latitude: float
    longitude: float
    distance_km: float
