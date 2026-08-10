"""
Health Analyzer Email Utility
Professional medical-themed HTML & Plain Text templates for Password Reset OTP.
"""

def get_password_reset_email_template(otp_code: str, user_name: str = "User") -> tuple[str, str]:
    """
    Returns (html_content, text_content) tuple for Health Analyzer OTP email.
    """
    text_content = f"""Hello {user_name},

Your One Time Password for resetting your password is:

{otp_code}

This OTP is valid for only 5 minutes.
Do not share this OTP with anyone.

If you didn't request this password reset, please ignore this email.

Regards,
Health Analyzer Team
"""

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Analyzer - Password Reset OTP</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }}
        .container {{ max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 157, 138, 0.08); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #0F9D8A 0%, #0d8272 100%); padding: 32px 24px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }}
        .header p {{ margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; color: #ccfbf1; font-weight: 600; }}
        .content {{ padding: 36px 28px; line-height: 1.6; }}
        .greeting {{ font-size: 17px; font-weight: 700; color: #0F9D8A; margin-bottom: 12px; }}
        .otp-container {{ background: #f0fdfa; border: 2px dashed #0F9D8A; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }}
        .otp-label {{ font-size: 12px; font-weight: 800; color: #0d8272; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }}
        .otp-code {{ font-size: 36px; font-weight: 900; color: #0F9D8A; letter-spacing: 8px; font-family: 'Courier New', monospace; }}
        .expiry-badge {{ font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }}
        .warning-box {{ background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #92400e; margin: 20px 0; }}
        .footer {{ background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="font-size: 36px; margin-bottom: 8px;">⚕️</div>
            <h1>Health Analyzer</h1>
            <p>Clinical Intelligence & Healthcare Analytics</p>
        </div>
        <div class="content">
            <div class="greeting">Hello {user_name},</div>
            <p>We received a request to reset your password for your <strong>Health Analyzer</strong> account.</p>
            <p>Your One Time Password (OTP) code is below:</p>
            
            <div class="otp-container">
                <div class="otp-label">Password Reset OTP</div>
                <div class="otp-code">{otp_code}</div>
                <div class="expiry-badge">⏱️ Valid for <strong>5 minutes</strong> only</div>
            </div>
            
            <div class="warning-box">
                <strong>Security Notice:</strong> Do not share this OTP with anyone. Health Analyzer support will never ask for your code.
            </div>
            
            <p style="color: #64748b; font-size: 13px;">If you didn't request this password reset, please ignore this email and your account password will remain unchanged.</p>
            
            <p style="margin-top: 28px; font-size: 14px;">Regards,<br><strong style="color: #0F9D8A;">Health Analyzer Team</strong></p>
        </div>
        <div class="footer">
            &copy; 2026 Health Analyzer. All rights reserved. Secure Medical Platform.
        </div>
    </div>
</body>
</html>"""

    return html_content, text_content
