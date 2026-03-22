from flask import Blueprint, request, jsonify, session
from .helpers import (
    generate_otp, send_otp_email, save_otp, verify_otp,
    is_username_taken, generate_username_suggestions,
    hash_password, check_password, assign_rank_badge,
    get_current_user
)
from .validators import (
    validate_gmail, validate_username,
    validate_name, validate_password
)
from database.db import execute_db, query_db, row_to_dict

auth_bp = Blueprint('auth', __name__)


# ── CHECK EMAIL ───────────────────────────────────
@auth_bp.route('/check-email', methods=['POST'])
def check_email():
    data = request.get_json()
    gmail = (data.get('gmail') or '').strip().lower()

    valid, msg = validate_gmail(gmail)
    if not valid:
        return jsonify({'error': msg}), 400

    existing = query_db(
        "SELECT id FROM users WHERE gmail = ?",
        (gmail,), one=True
    )
    return jsonify({'exists': existing is not None})


# ── SEND OTP ──────────────────────────────────────
@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    gmail = (data.get('gmail') or '').strip().lower()
    purpose = data.get('purpose', 'registration')

    valid, msg = validate_gmail(gmail)
    if not valid:
        return jsonify({'error': msg}), 400

    otp = generate_otp()
    save_otp(gmail, otp, purpose)

    # Try to send email — fall back to console in dev
    sent = send_otp_email(gmail, otp, purpose)
    if not sent:
        print(f"[DEV] OTP for {gmail}: {otp}")

    return jsonify({'success': True, 'message': 'OTP sent'})


# ── VERIFY OTP ────────────────────────────────────
@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp_route():
    data = request.get_json()
    gmail = (data.get('gmail') or '').strip().lower()
    otp = (data.get('otp') or '').strip()
    purpose = data.get('purpose', 'registration')

    success, message = verify_otp(gmail, otp, purpose)
    if not success:
        return jsonify({'error': message}), 400

    return jsonify({'success': True, 'verified': True})


# ── CHECK USERNAME ────────────────────────────────
@auth_bp.route('/check-username', methods=['POST'])
def check_username():
    data = request.get_json()
    username = (data.get('username') or '').strip()

    valid, msg = validate_username(username)
    if not valid:
        return jsonify({'available': False, 'error': msg})

    taken = is_username_taken(username)
    suggestions = generate_username_suggestions(username) if taken else []

    return jsonify({
        'available': not taken,
        'suggestions': suggestions
    })


# ── REGISTER ──────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    gmail = (data.get('gmail') or '').strip().lower()
    username = (data.get('username') or '').strip()
    name = (data.get('name') or '').strip()
    password = data.get('password') or ''

    # Validate all fields
    for validator, value in [
        (validate_gmail, gmail),
        (validate_username, username),
        (validate_name, name),
        (validate_password, password),
    ]:
        valid, msg = validator(value)
        if not valid:
            return jsonify({'error': msg}), 400

    # Check duplicates
    if query_db("SELECT id FROM users WHERE gmail = ?", (gmail,), one=True):
        return jsonify({'error': 'An account with this email already exists'}), 400

    if is_username_taken(username):
        return jsonify({'error': 'Username already taken'}), 400

    # Create user
    password_hash = hash_password(password)
    rank_badge = assign_rank_badge()

    user_id = execute_db(
        """INSERT INTO users (gmail, username, name, password_hash, rank_badge)
           VALUES (?, ?, ?, ?, ?)""",
        (gmail, username.lower(), name, password_hash, rank_badge)
    )

    # Create profile
    execute_db(
        "INSERT INTO profiles (user_id) VALUES (?)",
        (user_id,)
    )

    # Create settings
    execute_db(
        "INSERT INTO user_settings (user_id) VALUES (?)",
        (user_id,)
    )

    return jsonify({
        'success': True,
        'message': 'Account created successfully'
    }), 201


# ── LOGIN ─────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = (data.get('identifier') or '').strip()
    password = data.get('password') or ''

    if not identifier or not password:
        return jsonify({'error': 'Please enter your credentials'}), 400

    # Find user by gmail or username
    if '@' in identifier:
        user = query_db(
            "SELECT * FROM users WHERE gmail = ?",
            (identifier.lower(),), one=True
        )
    else:
        user = query_db(
            "SELECT * FROM users WHERE LOWER(username) = LOWER(?)",
            (identifier,), one=True
        )

    if not user:
        return jsonify({'error': 'No account found with these credentials'}), 401

    user = row_to_dict(user)

    # Check if account is locked
    if user.get('locked_until'):
        from datetime import datetime
        locked_until = datetime.fromisoformat(user['locked_until'])
        if datetime.utcnow() < locked_until:
            return jsonify({
                'error': 'Account temporarily locked. Try again in 15 minutes'
            }), 423

    # Check password
    if not check_password(user['password_hash'], password):
        attempts = user['login_attempts'] + 1
        if attempts >= 5:
            from datetime import datetime, timedelta
            locked_until = (datetime.utcnow() + timedelta(minutes=15)).isoformat()
            execute_db(
                "UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?",
                (attempts, locked_until, user['id'])
            )
            return jsonify({
                'error': 'Account temporarily locked. Try again in 15 minutes'
            }), 423
        else:
            execute_db(
                "UPDATE users SET login_attempts = ? WHERE id = ?",
                (attempts, user['id'])
            )
            remaining = 5 - attempts
            return jsonify({
                'error': f'Incorrect password. {remaining} attempts remaining'
            }), 401

    # Reset login attempts
    from datetime import datetime
    execute_db(
        """UPDATE users SET login_attempts = 0,
           locked_until = NULL, last_login = ?
           WHERE id = ?""",
        (datetime.utcnow().isoformat(), user['id'])
    )

    # Get full profile
    profile = query_db(
        """SELECT u.id, u.username, u.name, u.gmail,
                  u.rank_badge, p.bio, p.avatar_url,
                  p.is_private, p.show_rank_badge
           FROM users u
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE u.id = ?""",
        (user['id'],), one=True
    )

    profile = row_to_dict(profile)

    # Set session
    session['user_id'] = user['id']
    session.permanent = True

    return jsonify({
        'success': True,
        'user': profile
    })


# ── LOGOUT ────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})


# ── FORGOT PASSWORD ───────────────────────────────
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    gmail = (data.get('gmail') or '').strip().lower()

    # Always return success (don't reveal if email exists)
    user = query_db(
        "SELECT id FROM users WHERE gmail = ?",
        (gmail,), one=True
    )

    if user:
        otp = generate_otp()
        save_otp(gmail, otp, 'password_reset')
        sent = send_otp_email(gmail, otp, 'password_reset')
        if not sent:
            print(f"[DEV] Password reset OTP for {gmail}: {otp}")

    return jsonify({
        'success': True,
        'message': 'If an account exists with this email, an OTP has been sent'
    })


# ── RESET PASSWORD ────────────────────────────────
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    gmail = (data.get('gmail') or '').strip().lower()
    new_password = data.get('password') or ''

    valid, msg = validate_password(new_password)
    if not valid:
        return jsonify({'error': msg}), 400

    user = query_db(
        "SELECT * FROM users WHERE gmail = ?",
        (gmail,), one=True
    )

    if not user:
        return jsonify({'error': 'Account not found'}), 404

    user = row_to_dict(user)

    # Make sure new password is different
    if check_password(user['password_hash'], new_password):
        return jsonify({
            'error': 'New password cannot be the same as your current password'
        }), 400

    # Update password
    password_hash = hash_password(new_password)
    execute_db(
        "UPDATE users SET password_hash = ? WHERE gmail = ?",
        (password_hash, gmail)
    )

    # Clear all sessions
    session.clear()

    return jsonify({
        'success': True,
        'message': 'Password reset successfully'
    })


# ── ME (get current user) ─────────────────────────
@auth_bp.route('/me', methods=['GET'])
def me():
    user = get_current_user(session)
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    return jsonify({'user': user})