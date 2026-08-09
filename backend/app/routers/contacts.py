import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.contact import TrustedContact
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactResponse, ContactUpdate, InvitationResponse
from app.services.mailer import send_invitation_email

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


@router.get("", response_model=list[ContactResponse])
def list_contacts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(TrustedContact)
        .filter(TrustedContact.user_id == current_user.id)
        .order_by(TrustedContact.created_at.desc())
        .all()
    )


@router.get("/invitations", response_model=list[InvitationResponse])
def list_invitations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Pending invitations from other SafeStep accounts that added me by email."""
    pending = (
        db.query(TrustedContact)
        .filter(TrustedContact.linked_user_id == current_user.id, TrustedContact.status == "pending")
        .order_by(TrustedContact.created_at.desc())
        .all()
    )
    inviters = {u.id: u for u in db.query(User).filter(User.id.in_([c.user_id for c in pending])).all()}
    return [
        InvitationResponse(
            id=c.id,
            inviter_name=inviters[c.user_id].full_name,
            inviter_email=inviters[c.user_id].email,
            created_at=c.created_at,
        )
        for c in pending
        if c.user_id in inviters
    ]


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    payload: ContactCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    candidate = db.query(User).filter(User.email == data["email"]).first()
    linked_user = candidate if candidate and candidate.id != current_user.id else None

    contact = TrustedContact(
        user_id=current_user.id,
        linked_user_id=linked_user.id if linked_user else None,
        status="pending" if linked_user else "accepted",
        **data,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    if linked_user:
        background_tasks.add_task(send_invitation_email, linked_user.email, current_user.full_name)

    return contact


def _get_owned_contact(contact_id: uuid.UUID, current_user: User, db: Session) -> TrustedContact:
    contact = db.get(TrustedContact, contact_id)
    if not contact or contact.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return contact


def _get_invitation(contact_id: uuid.UUID, current_user: User, db: Session) -> TrustedContact:
    contact = db.get(TrustedContact, contact_id)
    if not contact or contact.linked_user_id != current_user.id or contact.status != "pending":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    return contact


@router.post("/invitations/{contact_id}/accept", response_model=ContactResponse)
def accept_invitation(
    contact_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = _get_invitation(contact_id, current_user, db)
    inviter = db.get(User, invitation.user_id)
    invitation.status = "accepted"

    # Create (or reuse) the reciprocal contact so both sides are mutually linked.
    reciprocal = (
        db.query(TrustedContact)
        .filter(TrustedContact.user_id == current_user.id, TrustedContact.linked_user_id == inviter.id)
        .first()
    )
    if reciprocal:
        reciprocal.status = "accepted"
    else:
        db.add(
            TrustedContact(
                user_id=current_user.id,
                name=inviter.full_name,
                phone=inviter.phone or "",
                email=inviter.email,
                linked_user_id=inviter.id,
                status="accepted",
            )
        )

    db.commit()
    db.refresh(invitation)
    return invitation


@router.post("/invitations/{contact_id}/decline", response_model=ContactResponse)
def decline_invitation(
    contact_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = _get_invitation(contact_id, current_user, db)
    invitation.status = "declined"
    db.commit()
    db.refresh(invitation)
    return invitation


@router.patch("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: uuid.UUID,
    payload: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = _get_owned_contact(contact_id, current_user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = _get_owned_contact(contact_id, current_user, db)
    db.delete(contact)
    db.commit()
