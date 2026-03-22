from database.db import execute_db, query_db, rows_to_list
from datetime import datetime, timedelta

def get_active_clips(user_id):
    rows = query_db(
        """SELECT sc.*,
                  s.title, s.artist,
                  s.thumbnail_url, s.youtube_id,
                  s.duration,
                  u.username, u.name,
                  p.avatar_url,
                  CASE WHEN cv.id IS NOT NULL
                       THEN 1 ELSE 0 END as is_viewed
           FROM song_clips sc
           JOIN songs s ON sc.song_id = s.id
           JOIN users u ON sc.user_id = u.id
           LEFT JOIN profiles p ON u.id = p.user_id
           LEFT JOIN clip_views cv ON (
               cv.clip_id = sc.id
               AND cv.viewer_id = ?
           )
           JOIN follows f ON (
               f.follower_id = ?
               AND f.following_id = sc.user_id
               AND f.status = 'accepted'
           )
           WHERE sc.is_active = 1
           AND sc.expires_at > CURRENT_TIMESTAMP
           AND sc.user_id != ?
           ORDER BY sc.posted_at DESC""",
        (user_id, user_id, user_id)
    )
    return rows_to_list(rows)

def create_clip(user_id, song_id,
                start_seconds, end_seconds):
    # Deactivate existing clip
    execute_db(
        """UPDATE song_clips SET is_active = 0
           WHERE user_id = ?""",
        (user_id,)
    )

    expires_at = (
        datetime.utcnow() + timedelta(hours=24)
    ).isoformat()

    clip_id = execute_db(
        """INSERT INTO song_clips
           (user_id, song_id, start_seconds,
            end_seconds, expires_at)
           VALUES (?, ?, ?, ?, ?)""",
        (user_id, song_id, start_seconds,
         end_seconds, expires_at)
    )
    return clip_id

def mark_clip_viewed(clip_id, viewer_id):
    execute_db(
        """INSERT OR IGNORE INTO clip_views
           (clip_id, viewer_id) VALUES (?, ?)""",
        (clip_id, viewer_id)
    )

def delete_clip(clip_id, user_id):
    execute_db(
        """UPDATE song_clips SET is_active = 0
           WHERE id = ? AND user_id = ?""",
        (clip_id, user_id)
    )