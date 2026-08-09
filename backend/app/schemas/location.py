import uuid
from datetime import datetime

from pydantic import BaseModel


class LocationUpdateRequest(BaseModel):
    latitude: float
    longitude: float


class LocationResponse(BaseModel):
    latitude: float
    longitude: float
    updated_at: datetime

    class Config:
        from_attributes = True


class ShareStartResponse(BaseModel):
    token: str
    expires_at: datetime
    share_path: str


class ContactLocationResponse(BaseModel):
    contact_user_id: uuid.UUID
    name: str
    latitude: float
    longitude: float
    updated_at: datetime
