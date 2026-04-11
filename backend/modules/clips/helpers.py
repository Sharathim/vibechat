from database.pg_db import execute_db, query_db, rows_to_list
from datetime import datetime, timedelta

def get_active_clips(user_id):
    rows = query_db(
        """SELECT sc.*,
                  s.title, s.artist,
                  s.thumbnail_url, s.youtube_id,
                  s.duration,
                  u.userid, u.name,
                  p.avatar_url,
                  CASE WHEN cv.id IS NOT NULL
                       THEN 1 ELSE 0 END as is_viewed
           FROM song_clips sc
           JOIN songs s ON sc.song_id = s.id
           JOIN users u ON sc.user_id = u.id
           LEFT JOIN profiles p ON u.id = p.user_id
           LEFT JOIN clip_views cv ON (
               cv.clip_id = sc.id
               AND cv.viewer_id = %s
           )
           JOIN follows f ON (
               f.follower_id = %s
               AND f.following_id = sc.user_id
               AND f.status = 'accepted'
           )
           WHERE sc.is_active = TRUE
           AND sc.expires_at > CURRENT_TIMESTAMP
           AND sc.user_id != %s
           ORDER BY sc.posted_at DESC""",
        (user_id, user_id, user_id)
    )
    return rows_to_list(rows)

def create_clip(user_id, song_id, start_seconds, end_seconds):
    execute_db(
        """UPDATE song_clips SET is_active = FALSE
           WHERE user_id = %s""",
        (user_id,)
    )

    expires_at = (
        datetime.utcnow() + timedelta(hours=24)
    ).isoformat()

    clip_id = execute_db(
        """INSERT INTO song_clips
           (user_id, song_id, start_seconds, end_seconds, expires_at)
           VALUES (%s, %s, %s, %s, %s)
           RETURNING id""",
        (user_id, song_id, start_seconds, end_seconds, expires_at)
    )
    return clip_id

def mark_clip_viewed(clip_id, viewer_id):
    execute_db(
        """INSERT INTO clip_views (clip_id, viewer_id)
           VALUES (%s, %s)
           ON CONFLICT DO NOTHING""",
        (clip_id, viewer_id)
    )

def delete_clip(clip_id, user_id):
    execute_db(
        """UPDATE song_clips SET is_active = FALSE
           WHERE id = %s AND user_id = %s""",
        (clip_id, user_id)
    )