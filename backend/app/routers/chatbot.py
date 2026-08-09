from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, ChatReplyResponse
from app.services.chatbot_service import get_chatbot_reply

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

_HISTORY_WINDOW = 10


@router.get("/history", response_model=list[ChatMessageResponse])
def chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )


@router.post("/message", response_model=ChatReplyResponse)
def send_message(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_msg = ChatMessage(
        user_id=current_user.id, role="user", language=payload.language, content=payload.message
    )
    db.add(user_msg)
    db.commit()

    recent = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(_HISTORY_WINDOW)
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in reversed(recent)]

    reply_text, source = get_chatbot_reply(payload.message, payload.language, history[:-1])

    assistant_msg = ChatMessage(
        user_id=current_user.id, role="assistant", language=payload.language, content=reply_text
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return ChatReplyResponse(reply=assistant_msg, source=source)
