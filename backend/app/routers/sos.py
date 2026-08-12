import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.contact import TrustedContact
from app.models.sos import SOSAlert
from app.models.user import User
from app.schemas.sos import SOSResponse, SOSTriggerRequest
from app.services.mailer import send_sos_alert_email

router = APIRouter(prefix="/api/sos", tags=["sos"])


def _to_response(
    alert: SOSAlert, notified: list[str] | None = None, unreachable: list[str] | None = None
) -> SOSResponse:
    resp = SOSResponse.model_validate(alert)
    resp.notified_contacts = notified or []
    resp.unreachable_contacts = unreachable or []
    return resp


@router.post("/trigger", response_model=SOSResponse, status_code=status.HTTP_201_CREATED)
def trigger_sos(
    payload: SOSTriggerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = SOSAlert(
        user_id=current_user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        message=payload.message,
        notify_police=payload.notify_police,
        status="active",
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Real email fan-out to trusted contacts. Contacts without an email on file can't
    # be reached this way (no SMS provider wired up), so they're reported separately
    # rather than silently claimed as "notified".
    contacts = db.query(TrustedContact).filter(TrustedContact.user_id == current_user.id).all()
    notified, unreachable = [], []
    for contact in contacts:
        if contact.email and send_sos_alert_email(
            contact.email, current_user.full_name, payload.latitude, payload.longitude, payload.message
        ):
            notified.append(contact.name)
        else:
            unreachable.append(contact.name)

    return _to_response(alert, notified, unreachable)


@router.get("/history", response_model=list[SOSResponse])
def sos_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = (
        db.query(SOSAlert)
        .filter(SOSAlert.user_id == current_user.id)
        .order_by(SOSAlert.created_at.desc())
        .all()
    )
    return [_to_response(a) for a in alerts]


@router.post("/{sos_id}/resolve", response_model=SOSResponse)
def resolve_sos(
    sos_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = db.get(SOSAlert, sos_id)
    if not alert or alert.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SOS alert not found")

    alert.status = "resolved"
    alert.resolved_at = datetime.now(timezone.utc)
    # Privacy-first: wipe precise location once the incident is resolved.
    alert.latitude = None
    alert.longitude = None
    db.commit()
    db.refresh(alert)
    return _to_response(alert)
