import uuid
from datetime import datetime

from pydantic import BaseModel, Field

VALID_CATEGORIES = {"safe", "unsafe", "well_lit", "isolated", "harassment", "suspicious_activity"}


class SafetyReportCreate(BaseModel):
    latitude: float
    longitude: float
    category: str = Field(description=f"one of {sorted(VALID_CATEGORIES)}")
    description: str | None = None


class SafetyReportResponse(BaseModel):
    id: uuid.UUID
    latitude: float
    longitude: float
    category: str
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True
