import random
import string
from datetime import datetime, timedelta
from flask_mail import Message
from extensions import mail, bcrypt
from database.db import execute_db, query_db, row_to_dict
from config import Config


# ── OTP ───────────────────────────────────────────

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(gmail, otp, purpose):
    subject_map = {
        'registration': 'Your VibeChat verification code',
        'password_reset': 'Reset your VibeChat password',
        'suspicious_login': 'VibeChat login verification',
    }
    subject = subject_map.get(purpose, 'Your VibeChat code')
    body = f"""
Hello,

Your VibeChat verification code is:

{otp}

This code expires in 10 minutes.

If you did not request this, please ignore this email.

— The VibeChat Team
"""
    try:
        msg = Message(
            subject=subject,
            recipients=[gmail],
            body=body
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Mail error: {e}")
        return False

def save_otp(gmail, otp, purpose):
    otp_hash = bcrypt.generate_password_hash(otp).decode('utf-8')
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Delete any existing OTP for this gmail + purpose
    execute_db(
        "DELETE FROM otp_verifications WHERE gmail = ? AND purpose = ?",
        (gmail, purpose)
    )

    execute_db(
        """INSERT INTO otp_verifications
           (gmail, otp_hash, purpose, expires_at)
           VALUES (?, ?, ?, ?)""",
        (gmail, otp_hash, purpose, expires_at.isoformat())
    )

def verify_otp(gmail, otp, purpose):
    record = query_db(
        """SELECT * FROM otp_verifications
           WHERE gmail = ? AND purpose = ?
           AND is_used = 0
           ORDER BY created_at DESC LIMIT 1""",
        (gmail, purpose),
        one=True
    )

    if not record:
        return False, "OTP not found"

    record = row_to_dict(record)

    # Check expiry
    expires_at = datetime.fromisoformat(record['expires_at'])
    if datetime.utcnow() > expires_at:
        return False, "OTP has expired"

    # Check attempts
    if record['attempts'] >= 3:
        return False, "Too many incorrect attempts"

    # Verify OTP
    if not bcrypt.check_password_hash(record['otp_hash'], otp):
        execute_db(
            "UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?",
            (record['id'],)
        )
        remaining = 3 - (record['attempts'] + 1)
        return False, f"Incorrect OTP. {remaining} attempts remaining"

    # Mark as used
    execute_db(
        "UPDATE otp_verifications SET is_used = 1 WHERE id = ?",
        (record['id'],)
    )

    return True, "OTP verified"


# ── USERNAME ──────────────────────────────────────

RESERVED_USERNAMES = [
    'admin', 'vibechat', 'support', 'help',
    'groqbot', 'system', 'official', 'moderator',
    'null', 'undefined'
]

def is_username_taken(username):
    if username.lower() in RESERVED_USERNAMES:
        return True
    user = query_db(
        "SELECT id FROM users WHERE LOWER(username) = LOWER(?)",
        (username,),
        one=True
    )
    return user is not None

def generate_username_suggestions(username):
    import random
    from datetime import datetime
    year = datetime.now().year
    r3 = random.randint(100, 999)
    r2 = random.randint(10, 99)
    return [
        f"{username}_{r3}",
        f"{username}.{r2}",
        f"{username}_{year}",
    ]


# ── PASSWORD ──────────────────────────────────────

def hash_password(password):
    return bcrypt.generate_password_hash(password).decode('utf-8')

def check_password(password_hash, password):
    return bcrypt.check_password_hash(password_hash, password)


# ── RANK BADGE ────────────────────────────────────

def assign_rank_badge():
    result = query_db(
        "SELECT MAX(rank_badge) as max_rank FROM users",
        one=True
    )
    if result and result['max_rank']:
        return result['max_rank'] + 1
    return 1


# ── SESSION ───────────────────────────────────────

def get_current_user(session):
    user_id = session.get('user_id')
    if not user_id:
        return None
    user = query_db(
        """SELECT u.*, p.bio, p.avatar_url, p.is_private,
                  p.show_rank_badge, p.show_online_status,
                  p.read_receipts, p.vibe_requests_from
           FROM users u
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE u.id = ? AND u.is_active = 1""",
        (user_id,),
        one=True
    )
    return row_to_dict(user)