import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> bool:
    """Best-effort email send. Returns False (and logs) instead of raising,
    so a mail-server hiccup never breaks the API request that triggered it."""
    settings = get_settings()
    if not settings.SMTP_HOST:
        logger.info("SMTP not configured - skipping email to %s: %s", to, subject)
        return False

    message = EmailMessage()
    message["From"] = settings.MAIL_FROM or settings.SMTP_USER
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False


def send_password_reset_email(to: str, token: str) -> bool:
    settings = get_settings()
    link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
    subject = "Reset your SafeStep password"
    body = (
        "We received a request to reset your SafeStep password.\n\n"
        f"Reset it here: {link}\n\n"
        "This link expires in 1 hour. If you didn't request this, you can ignore this email.\n\n"
        "— SafeStep"
    )
    return send_email(to, subject, body)


def send_sos_alert_email(
    to: str, sender_name: str, latitude: float, longitude: float, message: str | None
) -> bool:
    maps_link = f"https://www.google.com/maps?q={latitude},{longitude}"
    subject = f"🚨 SOS Alert from {sender_name}"
    body = (
        f"{sender_name} just sent an emergency SOS alert on SafeStep and listed you as a trusted contact.\n\n"
        f"Their location at the time of the alert: {maps_link}\n\n"
        + (f"Message: {message}\n\n" if message else "")
        + "Please try to reach them or check in as soon as you can.\n\n"
        "— SafeStep"
    )
    return send_email(to, subject, body)


def send_invitation_email(to: str, inviter_name: str, invite_token: str) -> bool:
    settings = get_settings()
    link = f"{settings.FRONTEND_URL.rstrip('/')}/invite/{invite_token}"
    subject = f"{inviter_name} added you as a trusted contact on SafeStep"
    body = (
        f"{inviter_name} added you as a trusted contact on SafeStep.\n\n"
        f"Open this link to accept or reject the invitation: {link}\n\n"
        "Once accepted, you'll be able to see each other's location and be notified "
        "if either of you sends an SOS alert.\n\n"
        "— SafeStep"
    )
    return send_email(to, subject, body)
