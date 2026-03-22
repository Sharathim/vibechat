from flask import request
from flask_socketio import join_room, leave_room, emit
from database.db import query_db
from .helpers import send_message, mark_messages_read

# Track online users: {user_id: socket_id}
online_users = {}

def register_chat_events(socketio):

    @socketio.on('connect')
    def handle_connect():
        print(f"Client connected: {request.sid}")

    @socketio.on('disconnect')
    def handle_disconnect():
        # Remove from online users
        user_id = None
        for uid, sid in list(online_users.items()):
            if sid == request.sid:
                user_id = uid
                break
        if user_id:
            del online_users[user_id]
            emit('user_offline',
                 {'user_id': user_id},
                 broadcast=True)
        print(f"Client disconnected: {request.sid}")

    @socketio.on('user_online')
    def handle_user_online(data):
        user_id = data.get('user_id')
        if user_id:
            online_users[user_id] = request.sid
            emit('user_online',
                 {'user_id': user_id},
                 broadcast=True)

    @socketio.on('join_conversation')
    def handle_join(data):
        conv_id = data.get('conversation_id')
        if conv_id:
            room = f"conv_{conv_id}"
            join_room(room)

    @socketio.on('leave_conversation')
    def handle_leave(data):
        conv_id = data.get('conversation_id')
        if conv_id:
            room = f"conv_{conv_id}"
            leave_room(room)

    @socketio.on('send_message')
    def handle_message(data):
        conv_id = data.get('conversation_id')
        sender_id = data.get('sender_id')
        content = data.get('content', '').strip()
        message_type = data.get('type', 'text')

        if not all([conv_id, sender_id, content]):
            return

        # Verify conversation exists
        conv = query_db(
            """SELECT * FROM conversations WHERE id = ?
               AND (user1_id = ? OR user2_id = ?)""",
            (conv_id, sender_id, sender_id), one=True
        )
        if not conv:
            return

        # Save message
        msg = send_message(
            conv_id, sender_id, message_type, content
        )

        # Emit to conversation room
        room = f"conv_{conv_id}"
        emit('receive_message', msg, room=room)

    @socketio.on('typing_start')
    def handle_typing_start(data):
        conv_id = data.get('conversation_id')
        user_id = data.get('user_id')
        if conv_id and user_id:
            room = f"conv_{conv_id}"
            emit('user_typing',
                 {'user_id': user_id, 'is_typing': True},
                 room=room, include_self=False)

    @socketio.on('typing_stop')
    def handle_typing_stop(data):
        conv_id = data.get('conversation_id')
        user_id = data.get('user_id')
        if conv_id and user_id:
            room = f"conv_{conv_id}"
            emit('user_typing',
                 {'user_id': user_id, 'is_typing': False},
                 room=room, include_self=False)

    @socketio.on('messages_read')
    def handle_read(data):
        conv_id = data.get('conversation_id')
        user_id = data.get('user_id')
        if conv_id and user_id:
            mark_messages_read(conv_id, user_id)
            room = f"conv_{conv_id}"
            emit('messages_read',
                 {'conversation_id': conv_id,
                  'reader_id': user_id},
                 room=room, include_self=False)