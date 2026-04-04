from flask import Blueprint, request, jsonify, session
from .helpers import (
    get_search_history, add_search_history,
    remove_search_history_item, clear_search_history
)
from modules.music.youtube_api import search_songs
from modules.auth.helpers import get_current_user
from database.pg_db import query_pg

search_bp = Blueprint('search', __name__)

def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


def _search_terms(query):
    terms = []
    for term in query.replace(',', ' ').split():
        cleaned = term.strip().lower()
        if cleaned:
            terms.append(cleaned)
    return terms


def _search_db_songs(query, limit=10):
    terms = _search_terms(query)
    if not terms:
        return []

    return query_pg(
        """SELECT
               youtube_id,
               title,
               thumbnail_url,
               tags,
               youtube_like_count,
               vibechat_like_count,
               duration,
               listened_count,
               created_at
           FROM songs
           WHERE title ILIKE %s
              OR EXISTS (
                  SELECT 1
                  FROM unnest(COALESCE(tags, ARRAY[]::text[])) AS tag
                  WHERE LOWER(tag) = ANY(%s)
              )
           ORDER BY listened_count DESC, youtube_like_count DESC, title ASC
           LIMIT %s""",
        (f'%{query}%', terms, limit)
    )


def _merge_search_results(db_results, youtube_results):
    songs = [dict(song) for song in db_results]
    seen_ids = {song.get('youtube_id') for song in songs if song.get('youtube_id')}
    if youtube_results:
        for song in youtube_results:
            youtube_id = song.get('youtube_id')
            if youtube_id and youtube_id in seen_ids:
                continue
            if youtube_id:
                seen_ids.add(youtube_id)
            songs.append(song)
    return songs


# ── SEARCH SONGS ──────────────────────────────────
@search_bp.route('/songs', methods=['GET'])
def search_songs_route():
    user, err, code = require_auth()
    if err:
        return err, code

    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'songs': []})

    db_results = _search_db_songs(query, limit=10)
    if len(db_results) >= 10:
        return jsonify({'songs': db_results[:10], 'source': 'database'})

    if db_results and len(db_results) < 10:
        remaining = 10 - len(db_results)
        youtube_results, error = search_songs(query, max_results=remaining)
        if error:
            return jsonify({
                'songs': db_results,
                'source': 'database',
                'message': error,
            })

        return jsonify({
            'songs': _merge_search_results(db_results, youtube_results)[:10],
            'source': 'mixed',
        })

    results, error = search_songs(query, max_results=10)
    if error:
        return jsonify({
            'songs': [],
            'source': 'external_unavailable',
            'message': error,
        })

    return jsonify({'songs': results[:10], 'source': 'youtube'})


# ── SEARCH USERS ──────────────────────────────────
@search_bp.route('/users', methods=['GET'])
def search_users_route():
    user, err, code = require_auth()
    if err:
        return err, code

    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'users': []})

    rows = query_db(
        """SELECT u.id, u.userid, u.name,
                  u.rank_badge, p.avatar_url,
                  p.is_private,
                  CASE WHEN f.status = 'accepted'
                       THEN 1 ELSE 0 END as is_following,
                  CASE WHEN f.status = 'pending'
                       THEN 1 ELSE 0 END as is_pending
           FROM users u
           LEFT JOIN profiles p ON u.id = p.user_id
           LEFT JOIN follows f ON (
               f.follower_id = ? AND f.following_id = u.id
           )
           WHERE u.id != ?
           AND (
               u.userid LIKE ?
               OR u.name LIKE ?
           )
           AND u.is_active = 1
           LIMIT 20""",
        (user['id'], user['id'],
         f'%{query}%', f'%{query}%')
    )

    return jsonify({'users': rows_to_list(rows)})


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


@search_bp.route('/history/<int:history_id>',
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