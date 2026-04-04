from database.pg_db import execute_pg, query_pg

def get_or_create_song_pg(youtube_id, title, artist,
                          duration, thumbnail_url, tags=None,
                          youtube_like_count=None):
    """
    Insert a song into PostgreSQL if it doesn't exist.
    Uses ON CONFLICT DO NOTHING.
    """
    sql = """
        INSERT INTO songs (youtube_id, title, artist, duration, thumbnail_url, tags, youtube_like_count)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (youtube_id) DO NOTHING
        RETURNING *
    """
    song = execute_pg(
        sql,
        (youtube_id, title, artist, duration, thumbnail_url, tags, youtube_like_count),
        fetch='one'
    )
    if song:
        return song

    # If insertion was skipped, fetch the existing song
    return query_pg(
        "SELECT * FROM songs WHERE youtube_id = %s",
        (youtube_id,),
        one=True
    )

def get_liked_songs(user_id):
    """Fetches liked songs for a user from PostgreSQL."""
    rows = query_pg(
        """SELECT s.*, ls.liked_at
           FROM liked_songs ls
           JOIN songs s ON ls.song_youtube_id = s.youtube_id
           WHERE ls.user_id = %s
           ORDER BY ls.liked_at DESC""",
        (user_id,)
    )
    return rows or []

def get_listening_history(user_id, limit=20):
    """Fetches listening history for a user from PostgreSQL."""
    rows = query_pg(
        """SELECT h.id, h.played_at, s.*
           FROM listening_history h
           JOIN songs s ON h.song_youtube_id = s.youtube_id
           WHERE h.user_id = %s
           ORDER BY h.played_at DESC
           LIMIT %s""",
        (user_id, limit)
    )
    return rows or []

def log_play(user_id, youtube_id):
    """
    Logs a song play event.
    1. Inserts into listening_history.
    2. Increments listened_count on the songs table.
    """
    # Ensure song exists before logging
    song = query_pg("SELECT 1 FROM songs WHERE youtube_id = %s", (youtube_id,), one=True)
    if not song:
        # In a real-world scenario, you might fetch info from YouTube here
        # For now, we'll just skip if the song isn't in our DB
        print(f"Skipping play log for unknown song: {youtube_id}")
        return

    execute_pg(
        "INSERT INTO listening_history (user_id, song_youtube_id) VALUES (%s, %s)",
        (user_id, youtube_id)
    )
    execute_pg(
        "UPDATE songs SET listened_count = listened_count + 1 WHERE youtube_id = %s",
        (youtube_id,)
    )