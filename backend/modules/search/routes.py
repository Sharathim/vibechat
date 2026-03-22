from flask import Blueprint, request, jsonify, session
from .helpers import (
    get_search_history, add_search_history,
    remove_search_history_item, clear_search_history
)
from modules.music.youtube_api import search_songs
from modules.music.helpers import get_or_create_song
from modules.auth.helpers import get_current_user
from database.db import query_db, rows_to_list
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

    # Search in DB first
    db_results = query_db(
        """SELECT * FROM songs
           WHERE title LIKE ? OR artist LIKE ?
           LIMIT 20""",
        (f'%{query}%', f'%{query}%')
    )

    if db_results:
        songs = rows_to_list(db_results)
        return jsonify({'songs': songs, 'source': 'database'})

    if not Config.YOUTUBE_API_KEY:
        return jsonify({
            'songs': [],
            'message': 'YouTube API not configured'
        })

    # Fallback to YouTube API
    results, error = search_songs(query)
    if error:
        return jsonify({'error': error, 'songs': []}), 400

    # Save to DB and return
    songs = []
    for r in results:
        song = get_or_create_song(
            youtube_id=r['youtube_id'],
            title=r['title'],
            artist=r['artist'],
            duration=r['duration'],
            thumbnail_url=r['thumbnail_url'],
        )
        songs.append(song)

    return jsonify({'songs': songs, 'source': 'youtube'})


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
        """SELECT u.id, u.username, u.name,
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
               u.username LIKE ?
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