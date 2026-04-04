from database.db import execute_db, query_db, row_to_dict, rows_to_list

def get_or_create_song(youtube_id, title, artist,
                        duration, thumbnail_url,
                        audio_url=None):
    existing = query_db(
        "SELECT * FROM songs WHERE youtube_id = ?",
        (youtube_id,), one=True
    )

    if existing:
        return row_to_dict(existing)

    song_id = execute_db(
        """INSERT INTO songs
           (youtube_id, title, artist, duration,
            thumbnail_url, s3_audio_url)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (youtube_id, title, artist, duration,
         thumbnail_url, audio_url)
    )

    return {
        'id': song_id,
        'youtube_id': youtube_id,
        'title': title,
        'artist': artist,
        'duration': duration,
        'thumbnail_url': thumbnail_url,
        's3_audio_url': audio_url,
    }


def get_liked_songs(user_id):
    rows = query_db(
        """SELECT s.*, ls.liked_at
           FROM liked_songs ls
           JOIN songs s ON ls.song_id = s.id
           WHERE ls.user_id = ?
           ORDER BY ls.liked_at DESC""",
        (user_id,)
    )
    return rows_to_list(rows)


def get_downloads(user_id):
    rows = query_db(
        """SELECT s.*, d.downloaded_at
           FROM downloads d
           JOIN songs s ON d.song_id = s.id
           WHERE d.user_id = ?
           ORDER BY d.downloaded_at DESC""",
        (user_id,)
    )
    return rows_to_list(rows)


def get_listening_history(user_id, limit=50):
    rows = query_db(
        """SELECT s.*, lh.played_at, lh.id as history_id
           FROM listening_history lh
           JOIN songs s ON lh.song_id = s.id
           WHERE lh.user_id = ?
           ORDER BY lh.played_at DESC
           LIMIT ?""",
        (user_id, limit)
    )
    return rows_to_list(rows)


def log_play(user_id, song_id):
    execute_db(
        """INSERT INTO listening_history (user_id, song_id)
           VALUES (?, ?)""",
        (user_id, song_id)
    )

    # Also add to feed activity
    execute_db(
        """INSERT OR IGNORE INTO feed_activity
           (user_id, song_id, activity_type)
           VALUES (?, ?, 'listen')""",
        (user_id, song_id)
    )