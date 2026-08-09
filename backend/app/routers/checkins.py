import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.checkin import ScheduledCheckIn
from app.models.user import User
from app.schemas.checkin import CheckInCreate, CheckInResponse

router = APIRouter(prefix="/api/checkins", tags=["checkins"])


@router.get("", response_model=list[CheckInResponse])
def list_checkins(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(ScheduledCheckIn)
        .filter(ScheduledCheckIn.user_id == current_user.id)
        .order_by(ScheduledCheckIn.scheduled_time.desc())
        .all()
    )


@router.post("", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
def create_checkin(
    payload: CheckInCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    checkin = ScheduledCheckIn(user_id=current_user.id, **payload.model_dump())
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


@router.post("/{checkin_id}/confirm", response_model=CheckInResponse)
def confirm_checkin(
    checkin_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    checkin = db.get(ScheduledCheckIn, checkin_id)
    if not checkin or checkin.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check-in not found")
    checkin.status = "confirmed"
    db.commit()
    db.refresh(checkin)
    return checkin


@router.delete("/{checkin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checkin(
    checkin_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    checkin = db.get(ScheduledCheckIn, checkin_id)
    if not checkin or checkin.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check-in not found")
    db.delete(checkin)
    db.commit()
