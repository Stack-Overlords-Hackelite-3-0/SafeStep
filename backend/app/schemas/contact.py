import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class ContactCreate(BaseModel):
    name: str
    phone: str
    email: EmailStr
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
    status: str
    linked_user_id: uuid.UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


class InvitationResponse(BaseModel):
    id: uuid.UUID
    inviter_name: str
    inviter_email: str
    created_at: datetime

    class Config:
        from_attributes = True


class InvitePreviewResponse(BaseModel):
    inviter_name: str
    status: str  # pending | accepted | declined
