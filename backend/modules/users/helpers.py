from database.db import execute_db, query_db, row_to_dict, rows_to_list

def get_user_profile(username, current_user_id=None):
    user = query_db(
        """SELECT u.id, u.username, u.name,
                  u.rank_badge, u.created_at,
                  p.bio, p.avatar_url, p.is_private,
                  p.show_rank_badge, p.show_online_status,
                  COUNT(DISTINCT f1.id) as followers_count,
                  COUNT(DISTINCT f2.id) as following_count,
                  COUNT(DISTINCT vs.id) as vibes_count
           FROM users u
           LEFT JOIN profiles p ON u.id = p.user_id
           LEFT JOIN follows f1 ON (
               f1.following_id = u.id
               AND f1.status = 'accepted'
           )
           LEFT JOIN follows f2 ON (
               f2.follower_id = u.id
               AND f2.status = 'accepted'
           )
           LEFT JOIN vibe_sessions vs ON (
               vs.host_user_id = u.id
               AND vs.status = 'ended'
           )
           WHERE u.username = ? AND u.is_active = 1
           GROUP BY u.id""",
        (username,), one=True
    )

    if not user:
        return None

    profile = row_to_dict(user)

    # Add follow status if current user provided
    if current_user_id:
        follow = query_db(
            """SELECT status FROM follows
               WHERE follower_id = ? AND following_id = ?""",
            (current_user_id, profile['id']), one=True
        )
        if follow:
            profile['follow_status'] = follow['status']
        else:
            profile['follow_status'] = 'none'

        # Mutual followers
        mutuals = query_db(
            """SELECT u.id, u.name, u.username, p.avatar_url
               FROM follows f1
               JOIN follows f2 ON f1.follower_id = f2.follower_id
               JOIN users u ON f1.follower_id = u.id
               LEFT JOIN profiles p ON u.id = p.user_id
               WHERE f1.following_id = ?
               AND f2.following_id = ?
               AND f1.status = 'accepted'
               AND f2.status = 'accepted'
               LIMIT 3""",
            (profile['id'], current_user_id)
        )
        profile['mutuals'] = rows_to_list(mutuals)

    return profile


def get_followers(user_id, limit=50, offset=0):
    rows = query_db(
        """SELECT u.id, u.username, u.name,
                  u.rank_badge, p.avatar_url
           FROM follows f
           JOIN users u ON f.follower_id = u.id
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE f.following_id = ?
           AND f.status = 'accepted'
           ORDER BY f.created_at DESC
           LIMIT ? OFFSET ?""",
        (user_id, limit, offset)
    )
    return rows_to_list(rows)


def get_following(user_id, limit=50, offset=0):
    rows = query_db(
        """SELECT u.id, u.username, u.name,
                  u.rank_badge, p.avatar_url
           FROM follows f
           JOIN users u ON f.following_id = u.id
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE f.follower_id = ?
           AND f.status = 'accepted'
           ORDER BY f.created_at DESC
           LIMIT ? OFFSET ?""",
        (user_id, limit, offset)
    )
    return rows_to_list(rows)


def get_follow_requests(user_id):
    rows = query_db(
        """SELECT f.id, f.created_at,
                  u.id as from_user_id,
                  u.username, u.name,
                  u.rank_badge, p.avatar_url
           FROM follows f
           JOIN users u ON f.follower_id = u.id
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE f.following_id = ?
           AND f.status = 'pending'
           ORDER BY f.created_at DESC""",
        (user_id,)
    )
    return rows_to_list(rows)