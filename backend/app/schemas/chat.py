import uuid
from datetime import datetime

from pydantic import BaseModel


class ChatMessageRequest(BaseModel):
    message: str
    language: str = "en"  # en | si | ta


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    language: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatReplyResponse(BaseModel):
    reply: ChatMessageResponse
    source: str  # "llm" | "rule_based"


class TranscribeResponse(BaseModel):
    text: str
