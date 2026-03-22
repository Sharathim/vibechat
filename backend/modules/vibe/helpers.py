from database.db import execute_db, query_db, row_to_dict, rows_to_list
from datetime import datetime

def create_vibe_session(conversation_id, host_user_id, is_cohost=False):
    session_id = execute_db(
        """INSERT INTO vibe_sessions
           (conversation_id, host_user_id, is_cohost, status)
           VALUES (?, ?, ?, 'active')""",
        (conversation_id, host_user_id, is_cohost)
    )
    return session_id

def get_vibe_session(session_id):
    session = query_db(
        "SELECT * FROM vibe_sessions WHERE id = ?",
        (session_id,), one=True
    )
    return row_to_dict(session)

def get_active_session(conversation_id):
    session = query_db(
        """SELECT * FROM vibe_sessions
           WHERE conversation_id = ?
           AND status = 'active'
           ORDER BY started_at DESC LIMIT 1""",
        (conversation_id,), one=True
    )
    return row_to_dict(session) if session else None

def get_vibe_queue(session_id):
    rows = query_db(
        """SELECT vq.*, s.title, s.artist,
                  s.thumbnail_url, s.duration,
                  s.youtube_id,
                  u.username as added_by_username
           FROM vibe_queue vq
           JOIN songs s ON vq.song_id = s.id
           JOIN users u ON vq.added_by = u.id
           WHERE vq.session_id = ?
           AND vq.is_played = 0
           ORDER BY vq.position ASC""",
        (session_id,)
    )
    return rows_to_list(rows)

def add_to_vibe_queue(session_id, song_id, added_by):
    position = query_db(
        """SELECT COUNT(*) as cnt FROM vibe_queue
           WHERE session_id = ? AND is_played = 0""",
        (session_id,), one=True
    )['cnt']

    execute_db(
        """INSERT INTO vibe_queue
           (session_id, song_id, added_by, position)
           VALUES (?, ?, ?, ?)""",
        (session_id, song_id, added_by, position)
    )

def remove_from_vibe_queue(session_id, song_id):
    execute_db(
        """DELETE FROM vibe_queue
           WHERE session_id = ? AND song_id = ?
           AND is_played = 0""",
        (session_id, song_id)
    )

def update_vibe_sync(session_id, song_id,
                     position, state):
    execute_db(
        """UPDATE vibe_sessions
           SET current_song_id = ?,
               playback_position = ?,
               playback_state = ?
           WHERE id = ?""",
        (song_id, position, state, session_id)
    )

def end_vibe_session(session_id):
    execute_db(
        """UPDATE vibe_sessions
           SET status = 'ended',
               ended_at = CURRENT_TIMESTAMP
           WHERE id = ?""",
        (session_id,)
    )

def get_vibe_recaps(conversation_id):
    sessions = query_db(
        """SELECT vs.*,
                  u.name as host_name
           FROM vibe_sessions vs
           JOIN users u ON vs.host_user_id = u.id
           WHERE vs.conversation_id = ?
           AND vs.status = 'ended'
           ORDER BY vs.started_at DESC""",
        (conversation_id,)
    )

    recaps = []
    for session in rows_to_list(sessions):
        songs = query_db(
            """SELECT s.* FROM vibe_queue vq
               JOIN songs s ON vq.song_id = s.id
               WHERE vq.session_id = ?
               ORDER BY vq.position""",
            (session['id'],)
        )

        started = datetime.fromisoformat(session['started_at'])
        ended = datetime.fromisoformat(
            session['ended_at']
        ) if session['ended_at'] else datetime.utcnow()
        duration = int((ended - started).total_seconds())

        recaps.append({
            'id': session['id'],
            'songs': rows_to_list(songs),
            'duration': duration,
            'started_at': session['started_at'],
            'ended_at': session['ended_at'],
        })

    return recaps