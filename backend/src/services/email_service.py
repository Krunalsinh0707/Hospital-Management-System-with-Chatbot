import os
import smtplib
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.utils.email import get_password_reset_email_template

logger = logging.getLogger("health_analyzer.email_service")

class EmailService:
    """
    Gmail SMTP Mailer for Health Analyzer using TLS on port 587.
    Reads SMTP credentials from environment variables.
    """
    def __init__(self):
        self.server = os.getenv("SMTP_SERVER", os.getenv("EMAIL_HOST", "smtp.gmail.com"))
        self.port = int(os.getenv("SMTP_PORT", os.getenv("EMAIL_PORT", 587)))
        self.sender_email = os.getenv("SMTP_EMAIL", os.getenv("EMAIL_ADDRESS", "morikrunalsinh7@gmail.com"))
        self.password = os.getenv("SMTP_PASSWORD", os.getenv("EMAIL_PASSWORD", "Krunal@0707"))

    def _send_otp_sync(self, recipient_email: str, otp_code: str, user_name: str = "User") -> bool:
        """Synchronous SMTP worker function."""
        html_content, text_content = get_password_reset_email_template(otp_code, user_name)

        msg = MIMEMultipart("alternative")
        msg["From"] = f"Health Analyzer <{self.sender_email}>"
        msg["To"] = recipient_email
        msg["Subject"] = "Health Analyzer Password Reset OTP"

        # Attach plain text and HTML versions
        msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        try:
            logger.info(f"Connecting to SMTP server {self.server}:{self.port} for {recipient_email}...")
            smtp = smtplib.SMTP(self.server, self.port, timeout=12)
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(self.sender_email, self.password)
            smtp.sendmail(self.sender_email, [recipient_email], msg.as_string())
            smtp.quit()
            logger.info(f"✅ Password reset OTP email delivered successfully to {recipient_email}")
            return True
        except Exception as e:
            err_str = str(e)
            if "535" in err_str or "BadCredentials" in err_str or "Username and Password not accepted" in err_str:
                clean_err = "Gmail Authentication Failed: Please generate a 16-character Google App Password from myaccount.google.com/apppasswords and update SMTP_PASSWORD in backend/.env."
                logger.error(f"❌ {clean_err}")
                raise Exception(clean_err)
            logger.error(f"❌ Failed to send SMTP email to {recipient_email}: {e}")
            raise e

    async def send_password_reset_otp(self, recipient_email: str, otp_code: str, user_name: str = "User") -> bool:
        """Asynchronously send password reset OTP email."""
        return await asyncio.to_thread(self._send_otp_sync, recipient_email, otp_code, user_name)

email_service = EmailService()
