import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import models  # noqa: F401 - ensures models are registered on Base before create_all
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import auth, chatbot, checkins, contacts, directions, helpers, location, public_places, routes, sos
from app.services.crypto import encrypt_legacy_chat_messages

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(title="SafeStep API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # No Alembic in this project — create_all only adds new tables, not columns on
    # existing ones, so ship additive column changes here.
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE trusted_contacts ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES users(id)"
        ))
        conn.execute(text(
            "ALTER TABLE trusted_contacts ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'accepted'"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_style VARCHAR(32) NOT NULL DEFAULT 'adventurer'"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_seed VARCHAR(255)"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_background VARCHAR(16)"
        ))
        conn.execute(text(
            "ALTER TABLE trusted_contacts ADD COLUMN IF NOT EXISTS invite_token VARCHAR(64)"
        ))
        conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS trusted_contacts_invite_token_key "
            "ON trusted_contacts (invite_token) WHERE invite_token IS NOT NULL"
        ))
    db = SessionLocal()
    try:
        encrypted_count = encrypt_legacy_chat_messages(db)
        if encrypted_count:
            logging.info("Encrypted %d pre-existing plaintext chat messages", encrypted_count)
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(contacts.router)
app.include_router(sos.router)
app.include_router(routes.router)
app.include_router(helpers.router)
app.include_router(public_places.router)
app.include_router(directions.router)
app.include_router(chatbot.router)
app.include_router(checkins.router)
app.include_router(location.router)
