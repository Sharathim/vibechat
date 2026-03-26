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

def send_otp_email(email, otp, purpose):
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
            recipients=[email],
            body=body
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Mail error: {e}")
        return False

def save_otp(email, otp, purpose):
    otp_hash = bcrypt.generate_password_hash(otp).decode('utf-8')
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Delete any existing OTP for this email + purpose
    execute_db(
        "DELETE FROM otp_verifications WHERE email = ? AND purpose = ?",
        (email, purpose)
    )

    execute_db(
        """INSERT INTO otp_verifications
           (email, otp_hash, purpose, expires_at)
           VALUES (?, ?, ?, ?)""",
        (email, otp_hash, purpose, expires_at.isoformat())
    )

def verify_otp(email, otp, purpose):
    record = query_db(
        """SELECT * FROM otp_verifications
           WHERE email = ? AND purpose = ?
           AND is_used = 0
           ORDER BY created_at DESC LIMIT 1""",
        (email, purpose),
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
    if not password_hash:
        return False
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
        """SELECT u.id, u.email, u.username, u.name, u.rank_badge,
                  u.google_id, u.password_hash IS NOT NULL as has_password,
                  p.bio, p.avatar_url, p.is_private,
                  p.show_rank_badge, p.show_online_status,
                  p.read_receipts, p.vibe_requests_from
           FROM users u
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE u.id = ? AND u.is_active = 1""",
        (user_id,),
        one=True
    )
    if not user:
        return None
    return row_to_dict(user)


# ── USER PROFILE QUERY ────────────────────────────

def get_user_profile(user_id: int) -> dict:
    """
    Get user profile in a consistent format for API responses.
    This is the SINGLE source of truth for user data structure.
    """
    profile = query_db(
        """SELECT u.id, u.username, u.name, u.email,
                  u.rank_badge, u.google_id,
                  u.password_hash IS NOT NULL as has_password,
                  p.bio, p.avatar_url, p.is_private, p.show_rank_badge
           FROM users u
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE u.id = ?""",
        (user_id,), one=True
    )
    return row_to_dict(profile) if profile else None


# ── GOOGLE AUTH ──────────────────────────────────

def generate_unique_username(base_name: str) -> str:
    """Generate a unique username from the user's name or email."""
    import re
    import random

    # Clean the base name: lowercase, remove special chars, keep alphanumeric and dots/underscores
    clean_name = re.sub(r'[^a-z0-9._]', '', base_name.lower().replace(' ', '_'))

    # Ensure it starts with a letter or number (not dot/underscore)
    if clean_name and clean_name[0] in '._':
        clean_name = 'user' + clean_name

    # Ensure minimum length
    if len(clean_name) < 3:
        clean_name = 'user_' + clean_name

    # Truncate if too long (leave room for suffix)
    if len(clean_name) > 20:
        clean_name = clean_name[:20]

    # Try the clean name first
    if not is_username_taken(clean_name):
        return clean_name

    # Add random suffix if taken
    for _ in range(10):
        suffix = random.randint(100, 9999)
        candidate = f"{clean_name}_{suffix}"
        if len(candidate) <= 30 and not is_username_taken(candidate):
            return candidate

    # Fallback: use timestamp
    from datetime import datetime
    ts = int(datetime.now().timestamp())
    return f"user_{ts}"


def get_or_create_google_user(email: str, google_id: str, name: str, avatar_url: str = None) -> tuple:
    """
    Get existing user by email OR create a new one.
    Handles account linking properly:

    1. If user exists with same email:
       - If google_id is NULL -> Link Google account to existing user
       - If google_id matches -> Login normally
       - If google_id different -> Error (email already linked to different Google account)

    2. If no user with this email:
       - Create new user with Google credentials

    Returns: (user_profile, is_new_user, error_message)
    """
    email = email.lower().strip()

    # Check if email exists
    existing_user = query_db(
        "SELECT id, google_id, password_hash FROM users WHERE email = ?",
        (email,), one=True
    )

    if existing_user:
        existing_user = row_to_dict(existing_user)
        user_id = existing_user['id']
        existing_google_id = existing_user['google_id']

        if existing_google_id is None:
            # ACCOUNT LINKING: User signed up with email, now linking Google
            execute_db(
                """UPDATE users SET google_id = ?, last_login = ?
                   WHERE id = ?""",
                (google_id, datetime.utcnow().isoformat(), user_id)
            )

            # Optionally update avatar if they don't have one
            if avatar_url:
                profile = query_db(
                    "SELECT avatar_url FROM profiles WHERE user_id = ?",
                    (user_id,), one=True
                )
                if profile and not profile['avatar_url']:
                    execute_db(
                        "UPDATE profiles SET avatar_url = ? WHERE user_id = ?",
                        (avatar_url, user_id)
                    )

            user_profile = get_user_profile(user_id)
            return user_profile, False, None

        elif existing_google_id == google_id:
            # Same Google account - normal login
            execute_db(
                "UPDATE users SET last_login = ? WHERE id = ?",
                (datetime.utcnow().isoformat(), user_id)
            )

            user_profile = get_user_profile(user_id)
            return user_profile, False, None

        else:
            # Different Google ID - this shouldn't happen unless someone
            # is trying to link a different Google account
            return None, False, "This email is already linked to a different Google account"

    # Check if this google_id already exists with different email
    existing_by_google = query_db(
        "SELECT email FROM users WHERE google_id = ?",
        (google_id,), one=True
    )

    if existing_by_google:
        other_email = existing_by_google['email']
        return None, False, f"This Google account is already linked to {other_email}"

    # CREATE NEW USER
    base_name = name if name else email.split('@')[0]
    username = generate_unique_username(base_name)
    rank_badge = assign_rank_badge()

    user_id = execute_db(
        """INSERT INTO users (email, username, name, google_id, rank_badge)
           VALUES (?, ?, ?, ?, ?)""",
        (email, username, name or username, google_id, rank_badge)
    )

    # Create profile with avatar from Google
    execute_db(
        "INSERT INTO profiles (user_id, avatar_url) VALUES (?, ?)",
        (user_id, avatar_url)
    )

    # Create settings
    execute_db(
        "INSERT INTO user_settings (user_id) VALUES (?)",
        (user_id,)
    )

    user_profile = get_user_profile(user_id)
    return user_profile, True, None


def set_password_for_google_user(user_id: int, password: str) -> tuple:
    """
    Allow a Google-only user to set a password for email login.
    Returns: (success, error_message)
    """
    user = query_db(
        "SELECT password_hash FROM users WHERE id = ?",
        (user_id,), one=True
    )

    if not user:
        return False, "User not found"

    if user['password_hash']:
        return False, "Password already set. Use forgot password to reset."

    password_hash = hash_password(password)
    execute_db(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (password_hash, user_id)
    )

    return True, None
