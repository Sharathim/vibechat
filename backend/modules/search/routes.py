from flask import Blueprint, request, jsonify, session
from .helpers import (
    get_search_history, add_search_history,
    remove_search_history_item, clear_search_history
)
from modules.music.youtube_api import search_songs as search_youtube
from modules.music.helpers import get_or_create_song_pg
from modules.auth.helpers import get_current_user
from database.pg_db import query_pg
from config import Config

search_bp = Blueprint('search', __name__)

def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


# ── SEARCH SONGS ──────────────────────────────────
@search_bp.route('/songs', methods=['GET'])
def search_songs_route():
    user, err, code = require_auth()
    if err:
        return err, code

    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'songs': []})

    # Step 1: Search PostgreSQL first
    db_results = query_pg(
        """
        SELECT *,
               (ts_rank(to_tsvector('english', title), websearch_to_tsquery('english', %s))) as rank
        FROM songs
        WHERE to_tsvector('english', title) @@ websearch_to_tsquery('english', %s)
           OR tags @> ARRAY[%s]
        ORDER BY listened_count DESC, youtube_like_count DESC, rank DESC
        LIMIT 10
        """,
        (query, query, query)
    )

    songs = db_results or []
    source = 'database'

    # Step 2: Return results based on availability
    if len(songs) < 10:
        limit = 10 - len(songs)
        yt_results, error = search_youtube(query, max_results=limit)

        if error:
            # Only return an error if we have NO results at all
            if not songs:
                return jsonify({
                    'songs': [],
                    'source': 'external_unavailable',
                    'message': error,
                }), 503
        else:
            # Combine and de-duplicate
            existing_ids = {s['youtube_id'] for s in songs}
            for r in yt_results:
                if r['youtube_id'] not in existing_ids:
                    songs.append(r)
            source = 'database_and_youtube'

    return jsonify({'songs': songs, 'source': source})


# ── SEARCH USERS ──────────────────────────────────
@search_bp.route('/users', methods=['GET'])
def search_users_route():
    user, err, code = require_auth()
    if err:
        return err, code

    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'users': []})

    rows = query_pg(
        """SELECT u.id, u.username AS userid, u.name,
                  u.rank_badge, p.avatar_url,
                  p.is_private,
                  CASE WHEN f.status = 'accepted'
                       THEN 1 ELSE 0 END as is_following,
                  CASE WHEN f.status = 'pending'
                       THEN 1 ELSE 0 END as is_pending
           FROM users u
           LEFT JOIN profiles p ON u.id = p.user_id
           LEFT JOIN follows f ON (
               f.follower_id = %s AND f.following_id = u.id
           )
           WHERE u.id != %s
           AND (
               u.username ILIKE %s
               OR u.name ILIKE %s
           )
           AND u.is_active = true
           LIMIT 20""",
        (user['id'], user['id'],
         f'%{query}%', f'%{query}%')
    )

    return jsonify({'users': rows or []})


# ── SEARCH HISTORY ────────────────────────────────
@search_bp.route('/history/<search_type>', methods=['GET'])
def get_history(search_type):
    user, err, code = require_auth()
    if err:
        return err, code

    if search_type not in ('song', 'user'):
        return jsonify({'error': 'Invalid type'}), 400

    history = get_search_history(user['id'], search_type)
    return jsonify({'history': history})


@search_bp.route('/history/<history_id>',
                 methods=['DELETE'])
def remove_history_item(history_id):
    user, err, code = require_auth()
    if err:
        return err, code

    remove_search_history_item(user['id'], history_id)
    return jsonify({'success': True})


@search_bp.route('/history/<search_type>/all',
                 methods=['DELETE'])
def clear_history(search_type):
    user, err, code = require_auth()
    if err:
        return err, code

    if search_type not in ('song', 'user'):
        return jsonify({'error': 'Invalid type'}), 400

    clear_search_history(user['id'], search_type)
    return jsonify({'success': True})


# ── ADD TO HISTORY ────────────────────────────────
@search_bp.route('/history', methods=['POST'])
def add_history():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    search_type = data.get('type')
    reference_id = data.get('reference_id')

    if not search_type or not reference_id:
        return jsonify({'error': 'type and reference_id required'}), 400

    add_search_history(user['id'], search_type, reference_id)
    return jsonify({'success': True})