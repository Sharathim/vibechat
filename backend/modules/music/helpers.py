from database.pg_db import execute_pg, query_pg, row_to_dict, rows_to_list


def _normalize_tags(tags):
    if not tags:
        return []
    if isinstance(tags, str):
        return [tag.strip() for tag in tags.split(',') if tag.strip()]
    return [str(tag).strip() for tag in tags if str(tag).strip()]


def ensure_song_record(youtube_id, title, artist=None,
                       duration=0, thumbnail_url='',
                       youtube_like_count=0, tags=None):
    normalized_tags = _normalize_tags(tags)
    normalized_artist = artist

    if isinstance(artist, (list, tuple)) and not tags:
        normalized_tags = _normalize_tags(artist)
        normalized_artist = normalized_tags[0] if normalized_tags else 'Unknown'

    if not normalized_artist:
        normalized_artist = normalized_tags[0] if normalized_tags else 'Unknown'

    execute_pg(
        """INSERT INTO songs
           (youtube_id, title, artist, duration, thumbnail_url,
            s3_audio_url, tags, youtube_like_count)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
           ON CONFLICT (youtube_id) DO UPDATE SET
               title = EXCLUDED.title,
               artist = EXCLUDED.artist,
               duration = EXCLUDED.duration,
               thumbnail_url = EXCLUDED.thumbnail_url,
               tags = COALESCE(EXCLUDED.tags, songs.tags),
               youtube_like_count = COALESCE(EXCLUDED.youtube_like_count, songs.youtube_like_count)""",
        (
            youtube_id,
            title,
            normalized_artist,
            int(duration or 0),
            thumbnail_url,
            None,
            normalized_tags,
            int(youtube_like_count or 0),
        )
    )

    pg_song = query_pg(
        "SELECT * FROM songs WHERE youtube_id = %s",
        (youtube_id,), one=True
    )

    return row_to_dict(pg_song)


def get_or_create_song(youtube_id, title, artist=None,
                       duration=0, thumbnail_url='',
                       youtube_like_count=0, tags=None):
    return ensure_song_record(
        youtube_id=youtube_id,
        title=title,
        artist=artist,
        duration=duration,
        thumbnail_url=thumbnail_url,
        youtube_like_count=youtube_like_count,
        tags=tags,
    )


def get_liked_songs(user_id):
    rows = query_pg(
        """SELECT s.*, ls.liked_at
           FROM liked_songs ls
           JOIN songs s ON ls.song_id = s.id
           WHERE ls.user_id = ?
           ORDER BY ls.liked_at DESC""",
        (user_id,)
    )
    return rows_to_list(rows)


def get_downloads(user_id):
    rows = query_pg(
        """SELECT s.*, d.downloaded_at
           FROM downloads d
           JOIN songs s ON d.song_id = s.id
           WHERE d.user_id = ?
           ORDER BY d.downloaded_at DESC""",
        (user_id,)
    )
    return rows_to_list(rows)


def get_listening_history(user_id, limit=50):
    rows = query_pg(
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
    execute_pg(
        """INSERT INTO listening_history (user_id, song_id)
           VALUES (?, ?)""",
        (user_id, song_id)
    )

    # Also add to feed activity
    execute_pg(
        """INSERT OR IGNORE INTO feed_activity
           (user_id, song_id, activity_type)
           VALUES (?, ?, 'listen')""",
        (user_id, song_id)
    )