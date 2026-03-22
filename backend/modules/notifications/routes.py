from flask import Blueprint, request, jsonify, session
from modules.auth.helpers import get_current_user
from database.db import execute_db, query_db, rows_to_list

notifications_bp = Blueprint('notifications', __name__)

def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


@notifications_bp.route('', methods=['GET'])
def get_notifications():
    user, err, code = require_auth()
    if err:
        return err, code

    rows = query_db(
        """SELECT n.*,
                  u.name as from_name,
                  u.username as from_username,
                  p.avatar_url as from_avatar
           FROM notifications n
           LEFT JOIN users u ON n.from_user_id = u.id
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE n.user_id = ?
           ORDER BY n.created_at DESC
           LIMIT 50""",
        (user['id'],)
    )
    return jsonify({'notifications': rows_to_list(rows)})


@notifications_bp.route('/read/<int:notif_id>',
                        methods=['POST'])
def mark_read(notif_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        """UPDATE notifications
           SET is_read = 1
           WHERE id = ? AND user_id = ?""",
        (notif_id, user['id'])
    )
    return jsonify({'success': True})


@notifications_bp.route('/read-all', methods=['POST'])
def mark_all_read():
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        """UPDATE notifications
           SET is_read = 1
           WHERE user_id = ?""",
        (user['id'],)
    )
    return jsonify({'success': True})


@notifications_bp.route('/unread-count', methods=['GET'])
def unread_count():
    user, err, code = require_auth()
    if err:
        return err, code

    result = query_db(
        """SELECT COUNT(*) as cnt
           FROM notifications
           WHERE user_id = ? AND is_read = 0""",
        (user['id'],), one=True
    )
    return jsonify({'count': result['cnt']})