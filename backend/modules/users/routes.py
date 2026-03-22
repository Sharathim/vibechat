from flask import Blueprint, request, jsonify, session
from .helpers import (
    get_user_profile, get_followers,
    get_following, get_follow_requests
)
from modules.auth.helpers import get_current_user
from database.db import execute_db, query_db, row_to_dict
import boto3
import base64
import uuid
from config import Config

users_bp = Blueprint('users', __name__)

def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


# ── OWN PROFILE ───────────────────────────────────
@users_bp.route('/profile/me', methods=['GET'])
def get_my_profile():
    user, err, code = require_auth()
    if err:
        return err, code

    profile = get_user_profile(user['username'], user['id'])
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    return jsonify({'user': profile})


# ── UPDATE PROFILE ────────────────────────────────
@users_bp.route('/profile/me', methods=['PUT'])
def update_my_profile():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    name = (data.get('name') or '').strip()
    username = (data.get('username') or '').strip()
    bio = (data.get('bio') or '').strip()

    from modules.auth.validators import validate_name, validate_username

    if name:
        valid, msg = validate_name(name)
        if not valid:
            return jsonify({'error': msg}), 400
        execute_db(
            "UPDATE users SET name = ? WHERE id = ?",
            (name, user['id'])
        )

    if username and username != user['username']:
        valid, msg = validate_username(username)
        if not valid:
            return jsonify({'error': msg}), 400

        existing = query_db(
            "SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?",
            (username, user['id']), one=True
        )
        if existing:
            return jsonify({'error': 'Username already taken'}), 400

        execute_db(
            "UPDATE users SET username = ? WHERE id = ?",
            (username.lower(), user['id'])
        )

    if bio is not None:
        if len(bio) > 80:
            return jsonify({'error': 'Bio too long (max 80 chars)'}), 400
        execute_db(
            "UPDATE profiles SET bio = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
            (bio, user['id'])
        )

    return jsonify({'success': True})


# ── UPLOAD AVATAR ─────────────────────────────────
@users_bp.route('/profile/me/avatar', methods=['POST'])
def upload_avatar():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    image_data = data.get('image')
    if not image_data:
        return jsonify({'error': 'No image provided'}), 400

    if not Config.AWS_ACCESS_KEY_ID:
        return jsonify({
            'error': 'S3 not configured',
            'avatar_url': None
        }), 400

    try:
        header, encoded = image_data.split(',', 1)
        image_bytes = base64.b64decode(encoded)
        ext = 'jpg' if 'jpeg' in header else 'png'
        filename = f"avatars/{user['id']}_{uuid.uuid4().hex}.{ext}"

        s3 = boto3.client(
            's3',
            aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
            region_name=Config.AWS_REGION,
        )

        s3.put_object(
            Bucket=Config.AWS_BUCKET_NAME,
            Key=filename,
            Body=image_bytes,
            ContentType=f'image/{ext}',
        )

        avatar_url = f"https://{Config.AWS_BUCKET_NAME}.s3.{Config.AWS_REGION}.amazonaws.com/{filename}"

        execute_db(
            "UPDATE profiles SET avatar_url = ? WHERE user_id = ?",
            (avatar_url, user['id'])
        )

        return jsonify({'success': True, 'avatar_url': avatar_url})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── VIEW OTHER PROFILE ────────────────────────────
@users_bp.route('/profile/<username>', methods=['GET'])
def get_profile(username):
    user, err, code = require_auth()
    if err:
        return err, code

    profile = get_user_profile(username, user['id'])
    if not profile:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'user': profile})


# ── FOLLOWERS ─────────────────────────────────────
@users_bp.route('/profile/me/followers', methods=['GET'])
def my_followers():
    user, err, code = require_auth()
    if err:
        return err, code

    followers = get_followers(user['id'])
    return jsonify({'followers': followers})


@users_bp.route('/profile/me/following', methods=['GET'])
def my_following():
    user, err, code = require_auth()
    if err:
        return err, code

    following = get_following(user['id'])
    return jsonify({'following': following})


# ── REMOVE FOLLOWER ───────────────────────────────
@users_bp.route('/profile/me/followers/<int:follower_id>',
                methods=['DELETE'])
def remove_follower(follower_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        """DELETE FROM follows
           WHERE follower_id = ? AND following_id = ?""",
        (follower_id, user['id'])
    )
    return jsonify({'success': True})


# ── FOLLOW / UNFOLLOW ─────────────────────────────
@users_bp.route('/follow/<int:target_id>', methods=['POST'])
def follow_user(target_id):
    user, err, code = require_auth()
    if err:
        return err, code

    if user['id'] == target_id:
        return jsonify({'error': 'Cannot follow yourself'}), 400

    # Check if target account is private
    target_profile = query_db(
        "SELECT is_private FROM profiles WHERE user_id = ?",
        (target_id,), one=True
    )

    status = 'pending' if (
        target_profile and target_profile['is_private']
    ) else 'accepted'

    try:
        execute_db(
            """INSERT OR IGNORE INTO follows
               (follower_id, following_id, status)
               VALUES (?, ?, ?)""",
            (user['id'], target_id, status)
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    # Create notification
    if status == 'pending':
        execute_db(
            """INSERT INTO notifications
               (user_id, type, from_user_id, message)
               VALUES (?, 'follow_request', ?, 'wants to follow you')""",
            (target_id, user['id'])
        )

        from extensions import socketio
        from modules.chat.socket_events import online_users

        target_sid = online_users.get(target_id)
        if target_sid:
            socketio.emit('new_notification', {
                'id': None,
                'type': 'follow_request',
                'from_name': user['name'],
                'from_username': user['username'],
                'from_avatar': user.get('avatar_url'),
                'message': 'wants to follow you',
                'is_read': False,
                'created_at': 'Just now',
            }, room=target_sid)

    return jsonify({'success': True, 'status': status})


@users_bp.route('/follow/<int:target_id>', methods=['DELETE'])
def unfollow_user(target_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        """DELETE FROM follows
           WHERE follower_id = ? AND following_id = ?""",
        (user['id'], target_id)
    )
    return jsonify({'success': True})


# ── FOLLOW REQUESTS ───────────────────────────────
@users_bp.route('/follow/requests', methods=['GET'])
def get_requests():
    user, err, code = require_auth()
    if err:
        return err, code

    requests_list = get_follow_requests(user['id'])
    return jsonify({'requests': requests_list})


@users_bp.route('/follow/requests/<int:request_id>/accept',
                methods=['POST'])
def accept_request(request_id):
    user, err, code = require_auth()
    if err:
        return err, code

    follow = query_db(
        """SELECT * FROM follows
           WHERE id = ? AND following_id = ?
           AND status = 'pending'""",
        (request_id, user['id']), one=True
    )

    if not follow:
        return jsonify({'error': 'Request not found'}), 404

    execute_db(
        "UPDATE follows SET status = 'accepted' WHERE id = ?",
        (request_id,)
    )

    # Notify the requester
    execute_db(
        """INSERT INTO notifications
           (user_id, type, from_user_id, message)
           VALUES (?, 'new_follower', ?, 'started following you')""",
        (follow['follower_id'], user['id'])
    )

    return jsonify({'success': True})


@users_bp.route('/follow/requests/<int:request_id>/decline',
                methods=['POST'])
def decline_request(request_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        """DELETE FROM follows
           WHERE id = ? AND following_id = ?""",
        (request_id, user['id'])
    )
    return jsonify({'success': True})