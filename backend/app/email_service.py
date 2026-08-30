"""
SMTP email delivery using the stdlib. Fully optional: if SMTP is not
configured, send_email returns False so callers can fall back to a dev
(console/response) mode.
"""
import logging
import os
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr

logger = logging.getLogger("uvicorn.error")


def email_configured() -> bool:
    return bool(os.getenv("SMTP_HOST"))


def send_email(to: str, subject: str, html: str) -> bool:
    """Send an HTML email.

    Reads SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM from env.
    Returns True on success, False when unconfigured or on failure.
    """
    host = os.getenv("SMTP_HOST")
    if not host:
        return False

    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    from_addr = os.getenv("EMAIL_FROM", user or "no-reply@spendwise.local")

    msg = MIMEText(html, "html", "utf-8")
    msg["Subject"] = subject
    msg["From"] = formataddr(("SpendWise", from_addr))
    msg["To"] = to

    try:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.starttls()
            if user:
                server.login(user, password)
            server.sendmail(from_addr, [to], msg.as_string())
        return True
    except Exception as exc:  # noqa: BLE001 - surface a clean failure to caller
        logger.error(f"Email send failed: {exc}")
        return False