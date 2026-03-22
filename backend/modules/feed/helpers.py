from database.db import query_db, rows_to_list
from datetime import datetime, timedelta

def get_feed(user_id, limit=20, offset=0):
    seven_days_ago = (
        datetime.utcnow() - timedelta(days=7)
    ).isoformat()

    rows = query_db(
        """SELECT
             fa.song_id,
             s.youtube_id,
             s.title,
             s.artist,
             s.thumbnail_url,
             s.duration,
             COUNT(DISTINCT fa.user_id) as like_count,
             MAX(fa.created_at) as latest_activity,
             GROUP_CONCAT(DISTINCT fa.activity_type)
                 as activity_types,
             CASE WHEN ls.song_id IS NOT NULL
                  THEN 1 ELSE 0 END as is_liked
           FROM feed_activity fa
           JOIN songs s ON fa.song_id = s.id
           JOIN follows f ON (
               f.follower_id = ?
               AND f.following_id = fa.user_id
               AND f.status = 'accepted'
           )
           LEFT JOIN liked_songs ls ON (
               ls.song_id = fa.song_id
               AND ls.user_id = ?
           )
           WHERE fa.created_at >= ?
           AND fa.user_id != ?
           GROUP BY fa.song_id
           ORDER BY latest_activity DESC
           LIMIT ? OFFSET ?""",
        (user_id, user_id, seven_days_ago,
         user_id, limit, offset)
    )

    feed = []
    for row in rows_to_list(rows):
        types = row.get('activity_types', '') or ''
        if 'like' in types and 'vibe' in types:
            activity_type = 'both'
        elif 'vibe' in types:
            activity_type = 'vibe'
        else:
            activity_type = 'like'

        feed.append({
            'id': row['song_id'],
            'song': {
                'id': row['song_id'],
                'youtube_id': row['youtube_id'],
                'title': row['title'],
                'artist': row['artist'],
                'thumbnail_url': row['thumbnail_url'],
                'duration': row['duration'],
            },
            'like_count': row['like_count'],
            'activity_type': activity_type,
            'timestamp': row['latest_activity'],
            'is_liked': bool(row['is_liked']),
        })

    return feed