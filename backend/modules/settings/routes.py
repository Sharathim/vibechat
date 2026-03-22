from flask import Blueprint, request, jsonify, session
from .helpers import get_user_settings, get_blocked_users
from modules.auth.helpers import get_current_user, hash_password, check_password
from modules.auth.validators import validate_password
from database.db import execute_db, query_db

settings_bp = Blueprint('settings', __name__)

def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


# ── GET ALL SETTINGS ──────────────────────────────
@settings_bp.route('', methods=['GET'])
def get_settings():
    user, err, code = require_auth()
    if err:
        return err, code

    settings = get_user_settings(user['id'])
    return jsonify({'settings': settings})


# ── PRIVACY SETTINGS ──────────────────────────────
@settings_bp.route('/privacy', methods=['PUT'])
def update_privacy():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    allowed_fields = {
        'is_private': bool,
        'show_rank_badge': bool,
        'show_online_status': bool,
        'read_receipts': bool,
        'vibe_requests_from': str,
    }

    updates = []
    values = []

    for field, field_type in allowed_fields.items():
        if field in data:
            value = data[field]
            if field == 'vibe_requests_from':
                if value not in ('everyone', 'following', 'nobody'):
                    continue
            updates.append(f"{field} = ?")
            values.append(value)

    if not updates:
        return jsonify({'error': 'No valid fields provided'}), 400

    values.append(user['id'])
    execute_db(
        f"UPDATE profiles SET {', '.join(updates)} WHERE user_id = ?",
        values
    )

    return jsonify({'success': True})


# ── NOTIFICATION SETTINGS ─────────────────────────
@settings_bp.route('/notifications', methods=['PUT'])
def update_notifications():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    allowed_fields = [
        'notif_follow_requests',
        'notif_messages',
        'notif_vibe_requests',
        'notif_shared_playlists',
    ]

    updates = []
    values = []

    for field in allowed_fields:
        if field in data:
            updates.append(f"{field} = ?")
            values.append(bool(data[field]))

    if not updates:
        return jsonify({'error': 'No valid fields provided'}), 400

    values.append(user['id'])
    execute_db(
        f"UPDATE user_settings SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        values
    )

    return jsonify({'success': True})


# ── APPEARANCE SETTINGS ───────────────────────────
@settings_bp.route('/appearance', methods=['PUT'])
def update_appearance():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    theme = data.get('theme')

    if theme not in ('light', 'dark'):
        return jsonify({'error': 'Invalid theme'}), 400

    execute_db(
        """UPDATE user_settings
           SET theme = ?, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?""",
        (theme, user['id'])
    )

    return jsonify({'success': True})


# ── CHANGE NAME ───────────────────────────────────
@settings_bp.route('/account/name', methods=['PUT'])
def change_name():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    name = (data.get('name') or '').strip()

    from modules.auth.validators import validate_name
    valid, msg = validate_name(name)
    if not valid:
        return jsonify({'error': msg}), 400

    execute_db(
        "UPDATE users SET name = ? WHERE id = ?",
        (name, user['id'])
    )

    return jsonify({'success': True, 'name': name})


# ── CHANGE USERNAME ───────────────────────────────
@settings_bp.route('/account/username', methods=['PUT'])
def change_username():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    username = (data.get('username') or '').strip()

    from modules.auth.validators import validate_username
    valid, msg = validate_username(username)
    if not valid:
        return jsonify({'error': msg}), 400

    existing = query_db(
        """SELECT id FROM users
           WHERE LOWER(username) = LOWER(?) AND id != ?""",
        (username, user['id']), one=True
    )
    if existing:
        return jsonify({'error': 'Username already taken'}), 400

    execute_db(
        "UPDATE users SET username = ? WHERE id = ?",
        (username.lower(), user['id'])
    )

    return jsonify({'success': True, 'username': username})


# ── CHANGE PASSWORD ───────────────────────────────
@settings_bp.route('/account/password', methods=['PUT'])
def change_password():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    current_password = data.get('current_password') or ''
    new_password = data.get('new_password') or ''

    # Get current hash
    user_data = query_db(
        "SELECT password_hash FROM users WHERE id = ?",
        (user['id'],), one=True
    )

    if not check_password(user_data['password_hash'], current_password):
        return jsonify({'error': 'Current password is incorrect'}), 400

    if check_password(user_data['password_hash'], new_password):
        return jsonify({
            'error': 'New password cannot be same as current'
        }), 400

    valid, msg = validate_password(new_password)
    if not valid:
        return jsonify({'error': msg}), 400

    new_hash = hash_password(new_password)
    execute_db(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (new_hash, user['id'])
    )

    session.clear()
    return jsonify({
        'success': True,
        'message': 'Password changed. Please log in again.'
    })


# ── CHANGE EMAIL ──────────────────────────────────
@settings_bp.route('/account/email', methods=['PUT'])
def change_email():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    new_email = (data.get('email') or '').strip().lower()

    from modules.auth.validators import validate_gmail
    valid, msg = validate_gmail(new_email)
    if not valid:
        return jsonify({'error': msg}), 400

    existing = query_db(
        "SELECT id FROM users WHERE gmail = ? AND id != ?",
        (new_email, user['id']), one=True
    )
    if existing:
        return jsonify({
            'error': 'This email is already registered'
        }), 400

    execute_db(
        "UPDATE users SET gmail = ? WHERE id = ?",
        (new_email, user['id'])
    )

    return jsonify({'success': True, 'email': new_email})


# ── DELETE ACCOUNT ────────────────────────────────
@settings_bp.route('/account', methods=['DELETE'])
def delete_account():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    password = data.get('password') or ''

    user_data = query_db(
        "SELECT password_hash FROM users WHERE id = ?",
        (user['id'],), one=True
    )

    if not check_password(user_data['password_hash'], password):
        return jsonify({'error': 'Incorrect password'}), 400

    # Soft delete — mark as inactive
    execute_db(
        "UPDATE users SET is_active = 0 WHERE id = ?",
        (user['id'],)
    )

    session.clear()
    return jsonify({
        'success': True,
        'message': 'Account deleted successfully'
    })


# ── BLOCKED USERS ─────────────────────────────────
@settings_bp.route('/blocked', methods=['GET'])
def get_blocked():
    user, err, code = require_auth()
    if err:
        return err, code

    blocked = get_blocked_users(user['id'])
    return jsonify({'blocked': blocked})


@settings_bp.route('/blocked/<int:target_id>',
                   methods=['POST'])
def block_user(target_id):
    user, err, code = require_auth()
    if err:
        return err, code

    try:
        execute_db(
            """INSERT OR IGNORE INTO blocked_users
               (user_id, blocked_id) VALUES (?, ?)""",
            (user['id'], target_id)
        )
        # Remove any follow relationship
        execute_db(
            """DELETE FROM follows
               WHERE (follower_id = ? AND following_id = ?)
               OR (follower_id = ? AND following_id = ?)""",
            (user['id'], target_id, target_id, user['id'])
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    return jsonify({'success': True})


@settings_bp.route('/blocked/<int:target_id>',
                   methods=['DELETE'])
def unblock_user(target_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        """DELETE FROM blocked_users
           WHERE user_id = ? AND blocked_id = ?""",
        (user['id'], target_id)
    )
    return jsonify({'success': True})