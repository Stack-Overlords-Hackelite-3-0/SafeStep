import re
import uuid

from pydantic import BaseModel, EmailStr, Field, field_validator

# Kept in sync with the curated style list in frontend/src/utils/avatar.js.
# Whitelisted server-side because these values get embedded in Leaflet marker
# HTML on the map views — an unvalidated string here would be a stored-XSS vector.
ALLOWED_AVATAR_STYLES = {
    "adventurer",
    "avataaars",
    "notionists",
    "lorelei",
    "micah",
    "big-smile",
    "croodles",
    "bottts",
    "pixel-art",
    "thumbs",
}
HEX_COLOR_RE = re.compile(r"^[0-9a-fA-F]{6}$")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    phone: str | None = None
    preferred_language: str = "en"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    phone: str | None
    preferred_language: str
    fake_caller_name: str
    avatar_style: str
    avatar_seed: str | None
    avatar_background: str | None

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    preferred_language: str | None = None
    fake_caller_name: str | None = None
    avatar_style: str | None = None
    avatar_seed: str | None = Field(default=None, max_length=255)
    avatar_background: str | None = None

    @field_validator("avatar_style")
    @classmethod
    def validate_avatar_style(cls, v: str | None) -> str | None:
        if v is not None and v not in ALLOWED_AVATAR_STYLES:
            raise ValueError("Unsupported avatar style")
        return v

    @field_validator("avatar_background")
    @classmethod
    def validate_avatar_background(cls, v: str | None) -> str | None:
        if v and not HEX_COLOR_RE.fullmatch(v):
            raise ValueError("avatar_background must be a 6-digit hex color")
        return v
