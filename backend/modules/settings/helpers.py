from database.db import execute_db, query_db, row_to_dict

def get_user_settings(user_id):
    settings = query_db(
        "SELECT * FROM user_settings WHERE user_id = ?",
        (user_id,), one=True
    )
    return row_to_dict(settings)

def get_blocked_users(user_id):
    from database.db import rows_to_list
    rows = query_db(
        """SELECT u.id, u.username, u.name,
                  p.avatar_url, bu.created_at
           FROM blocked_users bu
           JOIN users u ON bu.blocked_id = u.id
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE bu.user_id = ?
           ORDER BY bu.created_at DESC""",
        (user_id,)
    )
    from database.db import rows_to_list
    return rows_to_list(rows)