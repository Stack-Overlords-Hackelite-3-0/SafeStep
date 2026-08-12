import secrets
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.contact import TrustedContact
from app.models.user import User
from app.schemas.contact import (
    ContactCreate,
    ContactResponse,
    ContactUpdate,
    InvitationResponse,
    InvitePreviewResponse,
)
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
        status="pending",
        invite_token=secrets.token_urlsafe(24),
        **data,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    # Invite link works whether or not the contact already has a SafeStep account —
    # if they don't, accepting it prompts them to register first.
    background_tasks.add_task(send_invitation_email, data["email"], current_user.full_name, contact.invite_token)

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


def _link_reciprocal(db: Session, accepter: User, inviter: User) -> None:
    """Create (or reuse) the mirror contact on the accepter's side so both accounts
    are mutually linked — each can then see the other's location and gets notified
    on SOS."""
    reciprocal = (
        db.query(TrustedContact)
        .filter(TrustedContact.user_id == accepter.id, TrustedContact.linked_user_id == inviter.id)
        .first()
    )
    if reciprocal:
        reciprocal.status = "accepted"
    else:
        db.add(
            TrustedContact(
                user_id=accepter.id,
                name=inviter.full_name,
                phone=inviter.phone or "",
                email=inviter.email,
                linked_user_id=inviter.id,
                status="accepted",
            )
        )


@router.post("/invitations/{contact_id}/accept", response_model=ContactResponse)
def accept_invitation(
    contact_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invitation = _get_invitation(contact_id, current_user, db)
    inviter = db.get(User, invitation.user_id)
    invitation.status = "accepted"
    _link_reciprocal(db, current_user, inviter)

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


def _get_by_token(token: str, db: Session) -> TrustedContact:
    contact = db.query(TrustedContact).filter(TrustedContact.invite_token == token).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    return contact


@router.get("/invite/{token}", response_model=InvitePreviewResponse)
def preview_invite(token: str, db: Session = Depends(get_db)):
    """Public (no auth) preview so the invite link can show who sent it before the
    recipient logs in or decides whether to accept."""
    contact = _get_by_token(token, db)
    inviter = db.get(User, contact.user_id)
    return InvitePreviewResponse(inviter_name=inviter.full_name if inviter else "Someone", status=contact.status)


@router.post("/invite/{token}/accept", response_model=ContactResponse)
def accept_invite_by_token(
    token: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    contact = _get_by_token(token, db)
    if contact.status != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This invitation was already responded to")
    inviter = db.get(User, contact.user_id)
    if not inviter:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inviter no longer exists")

    contact.status = "accepted"
    contact.linked_user_id = current_user.id
    _link_reciprocal(db, current_user, inviter)

    db.commit()
    db.refresh(contact)
    return contact


@router.post("/invite/{token}/decline", status_code=status.HTTP_204_NO_CONTENT)
def decline_invite_by_token(token: str, db: Session = Depends(get_db)):
    # No auth required — rejecting an invite shouldn't force the recipient to sign
    # up first, and the unguessable token is the same trust model as the location
    # share links.
    contact = _get_by_token(token, db)
    if contact.status == "pending":
        contact.status = "declined"
        db.commit()


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
