from database.pg_db import execute_db, query_db, row_to_dict, rows_to_list
from datetime import datetime

def get_or_create_conversation(user1_id, user2_id):
    uid1 = min(user1_id, user2_id)
    uid2 = max(user1_id, user2_id)

    conv = query_db(
        """SELECT * FROM conversations
           WHERE user1_id = %s AND user2_id = %s""",
        (uid1, uid2), one=True
    )

    if conv:
        return row_to_dict(conv)

    conv_id = execute_db(
        """INSERT INTO conversations (user1_id, user2_id)
           VALUES (%s, %s)
           RETURNING id""",
        (uid1, uid2)
    )

    return {'id': conv_id, 'user1_id': uid1, 'user2_id': uid2}

def get_conversations(user_id):
    rows = query_db(
        """SELECT
             c.id,
             c.last_message_at,
             CASE
               WHEN c.user1_id = %s THEN c.user2_id
               ELSE c.user1_id
             END as other_user_id,
             u.userid, u.name,
             p.avatar_url,
             p.show_online_status,
             (SELECT content FROM messages
              WHERE conversation_id = c.id
              ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT type FROM messages
              WHERE conversation_id = c.id
              ORDER BY created_at DESC LIMIT 1) as last_message_type,
             (SELECT COUNT(*) FROM messages
              WHERE conversation_id = c.id
              AND sender_id != %s
              AND is_read = FALSE) as unread_count
           FROM conversations c
           JOIN users u ON u.id = (
               CASE WHEN c.user1_id = %s THEN c.user2_id
               ELSE c.user1_id END
           )
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE c.user1_id = %s OR c.user2_id = %s
           ORDER BY c.last_message_at DESC NULLS LAST""",
        (user_id, user_id, user_id, user_id, user_id)
    )
    return rows_to_list(rows)

def get_messages(conversation_id, limit=50, offset=0):
    rows = query_db(
        """SELECT m.*,
                  u.userid as sender_userid,
                  u.name as sender_name,
                  p.avatar_url as sender_avatar
           FROM messages m
           JOIN users u ON m.sender_id = u.id
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE m.conversation_id = %s
           ORDER BY m.created_at ASC
           LIMIT %s OFFSET %s""",
        (conversation_id, limit, offset)
    )
    return rows_to_list(rows)

def send_message(conversation_id, sender_id,
                 message_type, content):
    msg_id = execute_db(
        """INSERT INTO messages
           (conversation_id, sender_id, type, content)
           VALUES (%s, %s, %s, %s)
           RETURNING id""",
        (conversation_id, sender_id, message_type, content)
    )

    execute_db(
        """UPDATE conversations
           SET last_message_at = CURRENT_TIMESTAMP
           WHERE id = %s""",
        (conversation_id,)
    )

    msg = query_db(
        """SELECT m.*,
                  u.userid as sender_userid,
                  u.name as sender_name,
                  p.avatar_url as sender_avatar
           FROM messages m
           JOIN users u ON m.sender_id = u.id
           LEFT JOIN profiles p ON u.id = p.user_id
           WHERE m.id = %s""",
        (msg_id,), one=True
    )
    return row_to_dict(msg)

def mark_messages_read(conversation_id, user_id):
    execute_db(
        """UPDATE messages
           SET is_read = TRUE
           WHERE conversation_id = %s
           AND sender_id != %s
           AND is_read = FALSE""",
        (conversation_id, user_id)
    )