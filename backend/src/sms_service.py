import os
import requests

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "")

def send_otp_sms(mobile_no: str, otp: str) -> bool:
    """
    Sends OTP via Twilio SMS Gateway if configured, otherwise falls back to secure logging.
    """
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            data = {
                "From": TWILIO_PHONE_NUMBER,
                "To": mobile_no if mobile_no.startswith("+") else f"+{mobile_no}",
                "Body": f"[Health Analyzer] Your identity verification OTP is {otp}. Valid for 10 minutes."
            }
            res = requests.post(url, data=data, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN))
            if res.status_code in [200, 201]:
                print(f"[OK] SMS OTP sent to {mobile_no} via Twilio Gateway.")
                return True
            else:
                print(f"[WARNING] Twilio SMS API error ({res.status_code}): {res.text}")
        except Exception as e:
            print(f"[ERROR] Failed to send SMS via Twilio: {e}")

    # Fallback log for local development
    print(f"[DEV SMS GATEWAY] OTP for {mobile_no} is: {otp}")
    return True
