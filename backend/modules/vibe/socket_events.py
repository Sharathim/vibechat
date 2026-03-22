from flask_socketio import join_room, leave_room, emit
from .helpers import (
    get_vibe_session, get_vibe_queue,
    update_vibe_sync, add_to_vibe_queue,
    remove_from_vibe_queue, end_vibe_session
)

# Sync tolerance in seconds
SYNC_TOLERANCE = 2.0
SYNC_SMOOTH_THRESHOLD = 5.0

def register_vibe_events(socketio):

    @socketio.on('join_vibe')
    def handle_join_vibe(data):
        session_id = data.get('session_id')
        if session_id:
            room = f"vibe_{session_id}"
            join_room(room)

    @socketio.on('leave_vibe')
    def handle_leave_vibe(data):
        session_id = data.get('session_id')
        if session_id:
            room = f"vibe_{session_id}"
            leave_room(room)

    @socketio.on('vibe_sync')
    def handle_sync(data):
        session_id = data.get('session_id')
        song_id = data.get('song_id')
        position = data.get('position', 0)
        state = data.get('state', 'playing')
        user_id = data.get('user_id')

        if not session_id:
            return

        # Update DB
        update_vibe_sync(session_id, song_id,
                         position, state)

        # Broadcast to other user in session
        room = f"vibe_{session_id}"
        emit('vibe_state_update', {
            'session_id': session_id,
            'song_id': song_id,
            'position': position,
            'state': state,
            'from_user_id': user_id,
            'server_time': __import__('time').time(),
        }, room=room, include_self=False)

    @socketio.on('vibe_queue_add')
    def handle_queue_add(data):
        session_id = data.get('session_id')
        song_id = data.get('song_id')
        user_id = data.get('user_id')

        if not all([session_id, song_id, user_id]):
            return

        add_to_vibe_queue(session_id, song_id, user_id)
        queue = get_vibe_queue(session_id)

        room = f"vibe_{session_id}"
        emit('vibe_queue_updated', {
            'session_id': session_id,
            'queue': queue,
        }, room=room)

    @socketio.on('vibe_queue_remove')
    def handle_queue_remove(data):
        session_id = data.get('session_id')
        song_id = data.get('song_id')

        if not all([session_id, song_id]):
            return

        remove_from_vibe_queue(session_id, song_id)
        queue = get_vibe_queue(session_id)

        room = f"vibe_{session_id}"
        emit('vibe_queue_updated', {
            'session_id': session_id,
            'queue': queue,
        }, room=room)

    @socketio.on('vibe_end')
    def handle_vibe_end(data):
        session_id = data.get('session_id')
        user_id = data.get('user_id')

        if not session_id:
            return

        end_vibe_session(session_id)

        room = f"vibe_{session_id}"
        emit('vibe_ended', {
            'session_id': session_id,
            'ended_by': user_id,
        }, room=room)

    @socketio.on('vibe_request')
    def handle_vibe_request(data):
        to_user_id = data.get('to_user_id')
        from_user_id = data.get('from_user_id')
        from_name = data.get('from_name')
        from_avatar = data.get('from_avatar')
        is_cohost = data.get('is_cohost', False)

        if not all([to_user_id, from_user_id]):
            return

        from modules.chat.socket_events import online_users
        target_sid = online_users.get(to_user_id)

        if target_sid:
            emit('incoming_vibe_request', {
                'from_user_id': from_user_id,
                'from_name': from_name,
                'from_avatar': from_avatar,
                'is_cohost': is_cohost,
            }, room=target_sid)

    @socketio.on('vibe_request_response')
    def handle_vibe_response(data):
        to_user_id = data.get('to_user_id')
        accepted = data.get('accepted', False)
        session_id = data.get('session_id')

        from modules.chat.socket_events import online_users
        target_sid = online_users.get(to_user_id)

        if target_sid:
            emit('vibe_request_result', {
                'accepted': accepted,
                'session_id': session_id,
            }, room=target_sid)