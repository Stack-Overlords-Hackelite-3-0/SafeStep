import uuid
from datetime import datetime

from pydantic import BaseModel


class SOSTriggerRequest(BaseModel):
    latitude: float
    longitude: float
    message: str | None = None
    notify_police: bool = False


class SOSResponse(BaseModel):
    id: uuid.UUID
    latitude: float | None
    longitude: float | None
    message: str | None
    notify_police: bool
    status: str
    created_at: datetime
    resolved_at: datetime | None
    notified_contacts: list[str] = []
    unreachable_contacts: list[str] = []

    class Config:
        from_attributes = True
