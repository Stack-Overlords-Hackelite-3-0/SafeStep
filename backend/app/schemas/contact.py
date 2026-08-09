import uuid
from datetime import datetime

from pydantic import BaseModel


class ContactCreate(BaseModel):
    name: str
    phone: str
    email: str | None = None
    relationship_label: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    relationship_label: str | None = None


class ContactResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    email: str | None
    relationship_label: str | None
    created_at: datetime

    class Config:
        from_attributes = True
