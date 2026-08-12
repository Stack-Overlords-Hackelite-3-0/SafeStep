import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.contact import TrustedContact
from app.models.location import LocationPing, LocationShare
from app.models.user import User
from app.schemas.location import (
    ContactLocationResponse,
    LocationResponse,
    LocationUpdateRequest,
    ShareStartResponse,
    SharedLocationResponse,
)

router = APIRouter(prefix="/api/location", tags=["location"])


@router.post("/update", response_model=LocationResponse)
def update_location(
    payload: LocationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ping = db.query(LocationPing).filter(LocationPing.user_id == current_user.id).first()
    if ping is None:
        ping = LocationPing(user_id=current_user.id, latitude=payload.latitude, longitude=payload.longitude)
        db.add(ping)
    else:
        ping.latitude = payload.latitude
        ping.longitude = payload.longitude
        ping.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ping)
    return ping


@router.get("/contacts", response_model=list[ContactLocationResponse])
def list_contact_locations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Latest known location for every mutually-accepted trusted contact who has one."""
    linked = (
        db.query(TrustedContact)
        .filter(
            TrustedContact.user_id == current_user.id,
            TrustedContact.status == "accepted",
            TrustedContact.linked_user_id.isnot(None),
        )
        .all()
    )
    if not linked:
        return []

    linked_ids = [c.linked_user_id for c in linked]
    pings = {p.user_id: p for p in db.query(LocationPing).filter(LocationPing.user_id.in_(linked_ids)).all()}
    users = {u.id: u for u in db.query(User).filter(User.id.in_(linked_ids)).all()}

    results = []
    for contact in linked:
        ping = pings.get(contact.linked_user_id)
        contact_user = users.get(contact.linked_user_id)
        if not ping or not contact_user:
            continue
        results.append(
            ContactLocationResponse(
                contact_user_id=contact.linked_user_id,
                name=contact.name,
                latitude=ping.latitude,
                longitude=ping.longitude,
                updated_at=ping.updated_at,
                avatar_style=contact_user.avatar_style,
                avatar_seed=contact_user.avatar_seed or contact_user.email,
                avatar_background=contact_user.avatar_background,
            )
        )
    return results


@router.post("/share/start", response_model=ShareStartResponse)
def start_share(
    hours: float = 4,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Deactivate any previous active shares so only one link is valid at a time.
    db.query(LocationShare).filter(
        LocationShare.user_id == current_user.id, LocationShare.active.is_(True)
    ).update({"active": False})

    token = secrets.token_urlsafe(24)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=hours)
    share = LocationShare(user_id=current_user.id, token=token, expires_at=expires_at)
    db.add(share)
    db.commit()
    db.refresh(share)
    return ShareStartResponse(token=token, expires_at=expires_at, share_path=f"/share/{token}")


@router.post("/share/stop", status_code=status.HTTP_204_NO_CONTENT)
def stop_share(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(LocationShare).filter(
        LocationShare.user_id == current_user.id, LocationShare.active.is_(True)
    ).update({"active": False})
    db.commit()


@router.get("/share/{token}", response_model=SharedLocationResponse)
def view_shared_location(token: str, db: Session = Depends(get_db)):
    share = db.query(LocationShare).filter(LocationShare.token == token).first()
    if not share or not share.active or share.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share link is invalid or has expired")

    ping = db.query(LocationPing).filter(LocationPing.user_id == share.user_id).first()
    if not ping:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No location shared yet")

    sharer = db.get(User, share.user_id)
    return SharedLocationResponse(
        full_name=sharer.full_name,
        latitude=ping.latitude,
        longitude=ping.longitude,
        updated_at=ping.updated_at,
        avatar_style=sharer.avatar_style,
        avatar_seed=sharer.avatar_seed or sharer.email,
        avatar_background=sharer.avatar_background,
    )
