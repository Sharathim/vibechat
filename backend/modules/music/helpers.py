from database.db import execute_db, query_db, row_to_dict, rows_to_list
from database.pg_db import execute_pg, query_pg


def _normalize_tags(tags):
    if not tags:
        return []
    if isinstance(tags, str):
        return [tag.strip() for tag in tags.split(',') if tag.strip()]
    return [str(tag).strip() for tag in tags if str(tag).strip()]


def ensure_song_record(youtube_id, title, tags,
                       duration, thumbnail_url,
                       youtube_like_count=0):
    tags = _normalize_tags(tags)

    pg_song = query_pg(
        "SELECT * FROM songs WHERE youtube_id = %s",
        (youtube_id,), one=True
    )

    if not pg_song:
        execute_pg(
            """INSERT INTO songs
               (youtube_id, title, thumbnail_url, tags,
                youtube_like_count, duration)
               VALUES (%s, %s, %s, %s, %s, %s)
               ON CONFLICT (youtube_id) DO NOTHING""",
            (youtube_id, title, thumbnail_url, tags,
             int(youtube_like_count or 0), int(duration or 0))
        )
        pg_song = query_pg(
            "SELECT * FROM songs WHERE youtube_id = %s",
            (youtube_id,), one=True
        )

    legacy_song = query_db(
        "SELECT * FROM songs WHERE youtube_id = ?",
        (youtube_id,), one=True
    )

    if not legacy_song:
        legacy_artist = tags[0] if tags else 'Unknown'
        execute_db(
            """INSERT OR IGNORE INTO songs
               (youtube_id, title, artist, duration,
                thumbnail_url, s3_audio_url)
               VALUES (?, ?, ?, ?, ?, NULL)""",
            (youtube_id, title, legacy_artist,
             int(duration or 0), thumbnail_url)
        )
        legacy_song = query_db(
            "SELECT * FROM songs WHERE youtube_id = ?",
            (youtube_id,), one=True
        )

    legacy_data = row_to_dict(legacy_song) if legacy_song else {
        'id': None,
        'youtube_id': youtube_id,
        'title': title,
        'artist': tags[0] if tags else 'Unknown',
        'duration': int(duration or 0),
        'thumbnail_url': thumbnail_url,
        's3_audio_url': None,
    }

    return {
        'pg_song': pg_song,
        'legacy_song': legacy_data,
    }


def get_or_create_song(youtube_id, title, tags,
                       duration, thumbnail_url,
                       youtube_like_count=0):
    return ensure_song_record(
        youtube_id=youtube_id,
        title=title,
        tags=tags,
        duration=duration,
        thumbnail_url=thumbnail_url,
        youtube_like_count=youtube_like_count,
    )


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