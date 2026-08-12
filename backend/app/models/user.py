import uuid
from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(8), default="en")  # en | si | ta
    fake_caller_name: Mapped[str] = mapped_column(String(255), default="Mom")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    avatar_style: Mapped[str] = mapped_column(String(32), default="adventurer", server_default="adventurer")
    avatar_seed: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_background: Mapped[str | None] = mapped_column(String(16), nullable=True)

    trusted_contacts = relationship(
        "TrustedContact",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="TrustedContact.user_id",
    )
    sos_alerts = relationship("SOSAlert", back_populates="user", cascade="all, delete-orphan")
    safety_reports = relationship("SafetyReport", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    checkins = relationship("ScheduledCheckIn", back_populates="user", cascade="all, delete-orphan")
