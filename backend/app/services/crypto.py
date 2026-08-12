import base64
import hashlib
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken

from app.config import get_settings


@lru_cache
def _fernet() -> Fernet:
    settings = get_settings()
    # A dedicated CHAT_ENCRYPTION_KEY is preferred in production; falling back to a
    # key derived from JWT_SECRET means encryption works out of the box in dev
    # without requiring a second secret to be provisioned.
    secret = settings.CHAT_ENCRYPTION_KEY or settings.JWT_SECRET
    key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest())
    return Fernet(key)


def encrypt_text(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt_text(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        # Rows written before encryption was introduced are still plaintext —
        # return them as-is instead of erroring so old history stays readable.
        return token


def is_encrypted(token: str) -> bool:
    try:
        _fernet().decrypt(token.encode())
        return True
    except InvalidToken:
        return False


def encrypt_legacy_chat_messages(db) -> int:
    """One-time backfill: encrypt any chat_messages rows still stored in plaintext
    from before encryption-at-rest was added. Cheap no-op once everything is
    encrypted, since is_encrypted() short-circuits already-encrypted rows."""
    from app.models.chat import ChatMessage

    messages = db.query(ChatMessage).all()
    updated = 0
    for m in messages:
        if not is_encrypted(m.content):
            m.content = encrypt_text(m.content)
            updated += 1
    if updated:
        db.commit()
    return updated
