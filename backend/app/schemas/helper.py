import uuid
from datetime import datetime

from pydantic import BaseModel


class HelperResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str | None
    helper_type: str
    verified: bool
    available: bool
    latitude: float
    longitude: float
    distance_km: float | None = None
    created_at: datetime

    class Config:
        from_attributes = True
