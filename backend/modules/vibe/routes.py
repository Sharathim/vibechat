from flask import Blueprint, request, jsonify, session
from .helpers import (
    create_vibe_session, get_vibe_session,
    get_active_session, get_vibe_queue,
    add_to_vibe_queue, remove_from_vibe_queue,
    update_vibe_sync, end_vibe_session,
    get_vibe_recaps
)
from modules.auth.helpers import get_current_user
from database.db import query_db, execute_db

vibe_bp = Blueprint('vibe', __name__)

def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


# ── SEND VIBE REQUEST ─────────────────────────────
@vibe_bp.route('/request', methods=['POST'])
def send_request():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    to_user_id = data.get('to_user_id')
    is_cohost = data.get('is_cohost', False)

    if not to_user_id:
        return jsonify({'error': 'to_user_id required'}), 400

    # Check if vibe is blocked
    blocked = query_db(
        """SELECT id FROM blocked_vibe_users
           WHERE user_id = ? AND blocked_user_id = ?""",
        (to_user_id, user['id']), one=True
    )
    if blocked:
        return jsonify({'error': 'Vibe requests blocked'}), 403

    # Create notification
    execute_db(
        """INSERT INTO notifications
           (user_id, type, from_user_id, message)
           VALUES (?, 'vibe_request', ?, 'wants to vibe with you')""",
        (to_user_id, user['id'])
    )

    return jsonify({
        'success': True,
        'request': {
            'from_user_id': user['id'],
            'to_user_id': to_user_id,
            'is_cohost': is_cohost,
        }
    })


# ── ACCEPT VIBE REQUEST ───────────────────────────
@vibe_bp.route('/request/accept', methods=['POST'])
def accept_request():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    from_user_id = data.get('from_user_id')
    is_cohost = data.get('is_cohost', False)

    if not from_user_id:
        return jsonify({'error': 'from_user_id required'}), 400

    # Get or create conversation
    from modules.chat.helpers import get_or_create_conversation
    conv = get_or_create_conversation(user['id'], from_user_id)

    # Create vibe session
    session_id = create_vibe_session(
        conv['id'], from_user_id, is_cohost
    )

    return jsonify({
        'success': True,
        'session_id': session_id,
        'conversation_id': conv['id'],
    })


# ── GET VIBE STATE ────────────────────────────────
@vibe_bp.route('/<int:session_id>/state', methods=['GET'])
def get_state(session_id):
    user, err, code = require_auth()
    if err:
        return err, code

    vibe_session = get_vibe_session(session_id)
    if not vibe_session:
        return jsonify({'error': 'Session not found'}), 404

    queue = get_vibe_queue(session_id)

    return jsonify({
        'session': vibe_session,
        'queue': queue,
    })


# ── SYNC PLAYBACK ─────────────────────────────────
@vibe_bp.route('/<int:session_id>/sync', methods=['POST'])
def sync_playback(session_id):
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    song_id = data.get('song_id')
    position = data.get('position', 0)
    state = data.get('state', 'playing')

    update_vibe_sync(session_id, song_id, position, state)

    return jsonify({'success': True})


# ── ADD SONG TO QUEUE ─────────────────────────────
@vibe_bp.route('/<int:session_id>/queue/add',
               methods=['POST'])
def add_to_queue(session_id):
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    song_id = data.get('song_id')

    if not song_id:
        return jsonify({'error': 'song_id required'}), 400

    add_to_vibe_queue(session_id, song_id, user['id'])
    queue = get_vibe_queue(session_id)

    return jsonify({'success': True, 'queue': queue})


# ── REMOVE SONG FROM QUEUE ────────────────────────
@vibe_bp.route('/<int:session_id>/queue/<int:song_id>',
               methods=['DELETE'])
def remove_from_queue(session_id, song_id):
    user, err, code = require_auth()
    if err:
        return err, code

    remove_from_vibe_queue(session_id, song_id)
    queue = get_vibe_queue(session_id)

    return jsonify({'success': True, 'queue': queue})


# ── END VIBE SESSION ──────────────────────────────
@vibe_bp.route('/<int:session_id>/end', methods=['POST'])
def end_session(session_id):
    user, err, code = require_auth()
    if err:
        return err, code

    end_vibe_session(session_id)
    return jsonify({'success': True})


# ── GET VIBE RECAPS ───────────────────────────────
@vibe_bp.route('/recaps/<int:conversation_id>',
               methods=['GET'])
def get_recaps(conversation_id):
    user, err, code = require_auth()
    if err:
        return err, code

    recaps = get_vibe_recaps(conversation_id)
    return jsonify({'recaps': recaps})