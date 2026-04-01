"""
Auth helpers — Google OAuth-only auth with PostgreSQL.
"""

import random
from extensions import bcrypt
from database.pg_db import query_pg, execute_pg


# ── Reserved usernames ────────────────────────────
RESERVED_USERNAMES = [
    'admin', 'vibechat', 'support', 'help',
    'groqbot', 'system', 'official', 'moderator',
    'null', 'undefined', 'root', 'api',
]


# ── PASSWORD ──────────────────────────────────────

def hash_password(password):
    return bcrypt.generate_password_hash(password).decode('utf-8')


def check_password(password_hash, password):
    if not password_hash:
        return False
    return bcrypt.check_password_hash(password_hash, password)


# ── USERNAME ──────────────────────────────────────

def is_username_taken(username):
    """Check if a username is taken (reserved or in database)."""
    if username.lower() in RESERVED_USERNAMES:
        return True
    user = query_pg(
        "SELECT id FROM users WHERE username = %s",
        (username.lower(),),
        one=True,
    )
    return user is not None


def generate_username_suggestions(username):
    """Generate 3 alternative username suggestions."""
    r3 = random.randint(100, 999)
    r2 = random.randint(10, 99)
    suggestions = [
        f"{username}{r3}",
        f"{username}_vibe",
        f"{username}{r2:02d}",
    ]
    # Make sure suggestions are valid length and not taken
    valid = []
    for s in suggestions:
        if len(s) <= 20 and not is_username_taken(s):
            valid.append(s)
    # If some were filtered, add fallbacks
    while len(valid) < 3:
        fallback = f"{username}{random.randint(1, 9999)}"
        if len(fallback) <= 20 and fallback not in valid and not is_username_taken(fallback):
            valid.append(fallback)
    return valid[:3]


# ── USER QUERIES (PostgreSQL) ─────────────────────

def find_user_by_google_id_or_email(google_id, email):
    """Find an existing user by google_id or email."""
    user = query_pg(
        "SELECT * FROM users WHERE google_id = %s OR email = %s LIMIT 1",
        (google_id, email.lower()),
        one=True,
    )
    return user


def get_user_by_id(user_id):
    """Get a user by their primary key id."""
    return query_pg(
        """SELECT id, google_id, email, name,
                  username AS userid,
                  username,
                  created_at
           FROM users WHERE id = %s""",
        (user_id,),
        one=True,
    )


def create_user(google_id, email, name, username, password_hash):
    """Insert a new user into PostgreSQL, returns the user id."""
    user_id = execute_pg(
        """INSERT INTO users (google_id, email, name, username, password)
           VALUES (%s, %s, %s, %s, %s)
           RETURNING id""",
        (google_id, email.lower(), name, username.lower(), password_hash),
    )
    return user_id


# ── SESSION ───────────────────────────────────────

def get_current_user(session):
    """Get the currently logged-in user from session."""
    user_id = session.get('user_id')
    if not user_id:
        return None
    return get_user_by_id(user_id)


def format_user_response(user):
    """Format a user dict for API response (consistent shape)."""
    if not user:
        return None
    userid = user.get('userid') or user.get('username', '')
    return {
        'id': user['id'],
        'google_id': user.get('google_id'),
        'email': user.get('email', ''),
        'name': user.get('name', ''),
        'userid': userid,
        'username': userid,
        'created_at': str(user.get('created_at', '')),
    }
