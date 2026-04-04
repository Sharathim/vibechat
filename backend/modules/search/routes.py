from flask import Blueprint, request, jsonify, session
from datetime import datetime, timezone
from typing import List, Dict
import json
import boto3
from .helpers import (
    get_search_history, add_search_history,
    remove_search_history_item, clear_search_history
)
from modules.music.youtube_api import search_songs
from modules.music.ytdlp import get_song_info
from modules.auth.helpers import get_current_user
from database.db import query_db, rows_to_list
from database.pg_db import query_pg, execute_pg
from config import Config

search_bp = Blueprint('search', __name__)

def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


def _normalize_song_row(row: Dict):
    return {
        'youtube_id': row.get('youtube_id'),
        'title': row.get('title') or 'Unknown title',
        'thumbnail_url': row.get('thumbnail_url') or '',
        'tags': row.get('tags') or [],
        'youtube_like_count': int(row.get('youtube_like_count') or 0),
        'vibechat_like_count': int(row.get('vibechat_like_count') or 0),
        'duration': int(row.get('duration') or 0),
        'listened_count': int(row.get('listened_count') or 0),
    }


def _find_songs_in_pg(query_text: str, limit: int) -> List[Dict]:
    pattern = f"%{query_text}%"
    rows = query_pg(
        """SELECT youtube_id, title, thumbnail_url, tags,
                  youtube_like_count, vibechat_like_count,
                  duration, listened_count
           FROM songs
           WHERE title ILIKE %s
              OR EXISTS (
                  SELECT 1 FROM unnest(tags) AS tag
                  WHERE tag ILIKE %s
              )
           ORDER BY listened_count DESC, youtube_like_count DESC
           LIMIT %s""",
        (pattern, pattern, limit),
    )
    return [_normalize_song_row(r) for r in rows]


def _upsert_song_metadata(song: Dict):
    execute_pg(
        """INSERT INTO songs
           (youtube_id, title, thumbnail_url, tags,
            youtube_like_count, duration)
           VALUES (%s, %s, %s, %s, %s, %s)
           ON CONFLICT (youtube_id) DO NOTHING""",
        (
            song.get('youtube_id'),
            song.get('title') or 'Unknown title',
            song.get('thumbnail_url') or '',
            song.get('tags') or [],
            int(song.get('youtube_like_count') or 0),
            int(song.get('duration') or 0),
        ),
    )


def _backup_songs_to_s3():
    if not Config.AWS_ACCESS_KEY_ID or not Config.AWS_SECRET_ACCESS_KEY or not Config.AWS_BUCKET_NAME:
        return

    rows = query_pg(
        """SELECT youtube_id, title, thumbnail_url, tags,
                  youtube_like_count, vibechat_like_count,
                  duration, listened_count, created_at
           FROM songs
           ORDER BY created_at DESC"""
    )

    payload = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'count': len(rows),
        'songs': rows,
    }

    s3 = boto3.client(
        's3',
        aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
        region_name=Config.AWS_REGION,
    )

    s3.put_object(
        Bucket=Config.AWS_BUCKET_NAME,
        Key='backups/postgres/songs-latest.json',
        Body=json.dumps(payload, default=str).encode('utf-8'),
        ContentType='application/json',
    )


# ── SEARCH SONGS ──────────────────────────────────
@search_bp.route('/songs', methods=['GET'])
def search_songs_route():
    user, err, code = require_auth()
    if err:
        return err, code

    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'songs': [], 'source': 'database'})

    target_count = 10
    db_songs = _find_songs_in_pg(query, target_count)

    if len(db_songs) >= target_count:
        return jsonify({'songs': db_songs[:target_count], 'source': 'database'})

    needed = target_count - len(db_songs)
    yt_results, error = search_songs(query, max_results=needed)
    if error:
        return jsonify({
            'songs': db_songs,
            'source': 'mixed' if db_songs else 'external_unavailable',
            'message': error,
        })

    seen_ids = {s['youtube_id'] for s in db_songs}
    yt_songs = []
    for item in yt_results:
        youtube_id = item.get('youtube_id')
        if not youtube_id or youtube_id in seen_ids:
            continue
        yt_songs.append({
            'youtube_id': youtube_id,
            'title': item.get('title') or 'Unknown title',
            'thumbnail_url': item.get('thumbnail_url') or '',
            'tags': item.get('tags') or [],
            'youtube_like_count': int(item.get('youtube_like_count') or 0),
            'vibechat_like_count': 0,
            'duration': int(item.get('duration') or 0),
            'listened_count': 0,
        })
        seen_ids.add(youtube_id)

    merged = (db_songs + yt_songs)[:target_count]
    source = 'youtube' if not db_songs else 'mixed'
    return jsonify({'songs': merged, 'source': source})


@search_bp.route('/songs/select', methods=['POST'])
def select_song_route():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json(silent=True) or {}
    youtube_id = (data.get('youtube_id') or '').strip()

    if not youtube_id:
        return jsonify({'error': 'youtube_id required'}), 400

    info = get_song_info(youtube_id)
    if not info:
        return jsonify({'error': 'Could not fetch song metadata'}), 400

    song = {
        'youtube_id': youtube_id,
        'title': info.get('title') or 'Unknown title',
        'thumbnail_url': info.get('thumbnail_url') or '',
        'tags': info.get('tags') or [],
        'youtube_like_count': int(info.get('youtube_like_count') or 0),
        'duration': int(info.get('duration') or 0),
    }

    _upsert_song_metadata(song)
    try:
        _backup_songs_to_s3()
    except Exception as e:
        print(f"S3 backup warning: {e}")

    return jsonify({'success': True, 'song': _normalize_song_row(song)})


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