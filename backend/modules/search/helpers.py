from database.db import execute_db, query_db, rows_to_list

def get_search_history(user_id, search_type, limit=5):
    if search_type == 'song':
        rows = query_db(
            """SELECT sh.id, sh.type, sh.searched_at,
                      s.id as song_id, s.youtube_id,
                      s.title, s.artist, s.thumbnail_url,
                      s.duration
               FROM search_history sh
               JOIN songs s ON sh.reference_id = s.id
               WHERE sh.user_id = ? AND sh.type = 'song'
               ORDER BY sh.searched_at DESC
               LIMIT ?""",
            (user_id, limit)
        )
    else:
        rows = query_db(
            """SELECT sh.id, sh.type, sh.searched_at,
                      u.id as user_id, u.username,
                      u.name, p.avatar_url, u.rank_badge
               FROM search_history sh
               JOIN users u ON sh.reference_id = u.id
               LEFT JOIN profiles p ON u.id = p.user_id
               WHERE sh.user_id = ? AND sh.type = 'user'
               ORDER BY sh.searched_at DESC
               LIMIT ?""",
            (user_id, limit)
        )
    return rows_to_list(rows)

def add_search_history(user_id, search_type, reference_id):
    # Remove if already exists (to re-add at top)
    execute_db(
        """DELETE FROM search_history
           WHERE user_id = ? AND type = ?
           AND reference_id = ?""",
        (user_id, search_type, reference_id)
    )
    execute_db(
        """INSERT INTO search_history
           (user_id, type, reference_id)
           VALUES (?, ?, ?)""",
        (user_id, search_type, reference_id)
    )

def remove_search_history_item(user_id, history_id):
    execute_db(
        "DELETE FROM search_history WHERE id = ? AND user_id = ?",
        (history_id, user_id)
    )

def clear_search_history(user_id, search_type):
    execute_db(
        """DELETE FROM search_history
           WHERE user_id = ? AND type = ?""",
        (user_id, search_type)
    )