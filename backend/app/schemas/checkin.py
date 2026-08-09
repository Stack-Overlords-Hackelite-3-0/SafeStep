import uuid
from datetime import datetime

from pydantic import BaseModel


class CheckInCreate(BaseModel):
    scheduled_time: datetime
    note: str | None = None


class CheckInResponse(BaseModel):
    id: uuid.UUID
    scheduled_time: datetime
    status: str
    note: str | None
    created_at: datetime

    class Config:
        from_attributes = True
