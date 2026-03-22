from flask import Blueprint, request, jsonify, session
from .helpers import (
    get_or_create_conversation, get_conversations,
    get_messages, send_message, mark_messages_read
)
from modules.auth.helpers import get_current_user
from database.db import execute_db, query_db

chat_bp = Blueprint('chat', __name__)

def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


# ── GET ALL CONVERSATIONS ─────────────────────────
@chat_bp.route('/conversations', methods=['GET'])
def get_convs():
    user, err, code = require_auth()
    if err:
        return err, code

    conversations = get_conversations(user['id'])
    return jsonify({'conversations': conversations})


# ── GET OR CREATE CONVERSATION ────────────────────
@chat_bp.route('/conversations/with/<int:other_user_id>',
               methods=['POST'])
def get_or_create_conv(other_user_id):
    user, err, code = require_auth()
    if err:
        return err, code

    if user['id'] == other_user_id:
        return jsonify({'error': 'Cannot chat with yourself'}), 400

    conv = get_or_create_conversation(user['id'], other_user_id)
    return jsonify({'conversation': conv})


# ── GET MESSAGES ──────────────────────────────────
@chat_bp.route('/conversations/<int:conv_id>/messages',
               methods=['GET'])
def get_conv_messages(conv_id):
    user, err, code = require_auth()
    if err:
        return err, code

    # Verify user is part of conversation
    conv = query_db(
        """SELECT * FROM conversations
           WHERE id = ?
           AND (user1_id = ? OR user2_id = ?)""",
        (conv_id, user['id'], user['id']), one=True
    )
    if not conv:
        return jsonify({'error': 'Conversation not found'}), 404

    offset = int(request.args.get('offset', 0))
    messages = get_messages(conv_id, offset=offset)

    # Mark as read
    mark_messages_read(conv_id, user['id'])

    return jsonify({'messages': messages})


# ── SEND MESSAGE ──────────────────────────────────
@chat_bp.route('/conversations/<int:conv_id>/messages',
               methods=['POST'])
def send_conv_message(conv_id):
    user, err, code = require_auth()
    if err:
        return err, code

    conv = query_db(
        """SELECT * FROM conversations
           WHERE id = ?
           AND (user1_id = ? OR user2_id = ?)""",
        (conv_id, user['id'], user['id']), one=True
    )
    if not conv:
        return jsonify({'error': 'Conversation not found'}), 404

    data = request.get_json()
    content = (data.get('content') or '').strip()
    message_type = data.get('type', 'text')

    if not content:
        return jsonify({'error': 'Message cannot be empty'}), 400

    msg = send_message(conv_id, user['id'], message_type, content)
    return jsonify({'message': msg}), 201


# ── CLEAR CHAT ────────────────────────────────────
@chat_bp.route('/conversations/<int:conv_id>/clear',
               methods=['POST'])
def clear_chat(conv_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        """DELETE FROM messages
           WHERE conversation_id = ?
           AND sender_id = ?""",
        (conv_id, user['id'])
    )
    return jsonify({'success': True})


# ── REMOVE CONVERSATION ───────────────────────────
@chat_bp.route('/conversations/<int:conv_id>',
               methods=['DELETE'])
def remove_conversation(conv_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        """DELETE FROM conversations
           WHERE id = ?
           AND (user1_id = ? OR user2_id = ?)""",
        (conv_id, user['id'], user['id'])
    )
    return jsonify({'success': True})


# ── BLOCK VIBE FROM USER ──────────────────────────
@chat_bp.route('/conversations/<int:conv_id>/block-vibe',
               methods=['POST'])
def block_vibe(conv_id):
    user, err, code = require_auth()
    if err:
        return err, code

    conv = query_db(
        """SELECT * FROM conversations WHERE id = ?
           AND (user1_id = ? OR user2_id = ?)""",
        (conv_id, user['id'], user['id']), one=True
    )
    if not conv:
        return jsonify({'error': 'Conversation not found'}), 404

    other_id = (conv['user2_id']
                if conv['user1_id'] == user['id']
                else conv['user1_id'])

    execute_db(
        """INSERT OR IGNORE INTO blocked_vibe_users
           (user_id, blocked_user_id) VALUES (?, ?)""",
        (user['id'], other_id)
    )
    return jsonify({'success': True})