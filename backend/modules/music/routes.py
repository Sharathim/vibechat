from flask import Blueprint, request, jsonify, session, Response, stream_with_context
from .helpers import (
    get_or_create_song, get_liked_songs,
    get_downloads, get_listening_history, log_play
)
from .youtube_api import search_songs
from .ytdlp import get_audio_url, get_song_info
from database.db import execute_db, query_db, row_to_dict, rows_to_list
from modules.auth.helpers import get_current_user
import requests as req

music_bp = Blueprint('music', __name__)


def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


@music_bp.route('/thumbnail')
def proxy_thumbnail():
    url = request.args.get('url', '')
    if not url:
        return '', 404
    try:
        response = req.get(url, timeout=5, headers={
            'User-Agent': 'Mozilla/5.0'
        })
        from flask import Response
        return Response(
            response.content,
            content_type=response.headers.get(
                'content-type', 'image/jpeg'
            )
        )
    except Exception:
        return '', 404


# ── STREAM SONG ───────────────────────────────────
@music_bp.route('/stream/<youtube_id>')
def stream_song(youtube_id):
    user, err, code = require_auth()
    if err:
        return err, code

    # Check DB for cached S3 URL first
    song = query_db(
        """SELECT * FROM songs 
           WHERE youtube_id = ? OR CAST(id AS TEXT) = ?""",
        (youtube_id, youtube_id), one=True
    )

    if song:
        song = row_to_dict(song)
        yt_id = song.get('youtube_id', youtube_id)
        if song.get('s3_audio_url'):
            return jsonify({'audio_url': song['s3_audio_url']})
    else:
        yt_id = youtube_id

    # Get direct URL via yt-dlp
    from .ytdlp import get_audio_url
    audio_url, error = get_audio_url(yt_id)

    if error:
        return jsonify({'error': error}), 400

    # Proxy the audio stream through Flask
    # This bypasses CORS restrictions
    def generate():
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://www.youtube.com/',
            }
            with req.get(
                audio_url,
                stream=True,
                headers=headers,
                timeout=30
            ) as r:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        yield chunk
        except Exception as e:
            print(f"Stream error: {e}")

    # Get content type
    try:
        head = req.head(
            audio_url,
            headers={'User-Agent': 'Mozilla/5.0'},
            timeout=5
        )
        content_type = head.headers.get(
            'content-type', 'audio/webm'
        )
    except Exception:
        content_type = 'audio/webm'

    return Response(
        stream_with_context(generate()),
        content_type=content_type,
        headers={
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': 'http://localhost:5173',
            'Access-Control-Allow-Credentials': 'true',
        }
    )


# ── LOG PLAY ──────────────────────────────────────
@music_bp.route('/history', methods=['POST'])
def add_to_history():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    song_id = data.get('song_id')
    if not song_id:
        return jsonify({'error': 'song_id required'}), 400

    log_play(user['id'], song_id)
    return jsonify({'success': True})


# ── GET HISTORY ───────────────────────────────────
@music_bp.route('/history', methods=['GET'])
def get_history():
    user, err, code = require_auth()
    if err:
        return err, code

    history = get_listening_history(user['id'])
    return jsonify({'history': history})


# ── DELETE HISTORY ITEM ───────────────────────────
@music_bp.route('/history/<int:history_id>', methods=['DELETE'])
def delete_history_item(history_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        "DELETE FROM listening_history WHERE id = ? AND user_id = ?",
        (history_id, user['id'])
    )
    return jsonify({'success': True})


# ── CLEAR HISTORY ─────────────────────────────────
@music_bp.route('/history/all', methods=['DELETE'])
def clear_history():
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        "DELETE FROM listening_history WHERE user_id = ?",
        (user['id'],)
    )
    return jsonify({'success': True})


# ── LIKED SONGS ───────────────────────────────────
@music_bp.route('/liked', methods=['GET'])
def get_liked():
    user, err, code = require_auth()
    if err:
        return err, code

    songs = get_liked_songs(user['id'])
    return jsonify({'songs': songs})


@music_bp.route('/liked/<int:song_id>', methods=['POST'])
def like_song(song_id):
    user, err, code = require_auth()
    if err:
        return err, code

    try:
        execute_db(
            "INSERT OR IGNORE INTO liked_songs (user_id, song_id) VALUES (?, ?)",
            (user['id'], song_id)
        )
        execute_db(
            """INSERT OR IGNORE INTO feed_activity
               (user_id, song_id, activity_type)
               VALUES (?, ?, 'like')""",
            (user['id'], song_id)
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    return jsonify({'success': True, 'liked': True})


@music_bp.route('/liked/<int:song_id>', methods=['DELETE'])
def unlike_song(song_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        "DELETE FROM liked_songs WHERE user_id = ? AND song_id = ?",
        (user['id'], song_id)
    )
    execute_db(
        """DELETE FROM feed_activity
           WHERE user_id = ? AND song_id = ?
           AND activity_type = 'like'""",
        (user['id'], song_id)
    )
    return jsonify({'success': True, 'liked': False})


# ── DOWNLOADS ─────────────────────────────────────
@music_bp.route('/downloads', methods=['GET'])
def get_downloads_route():
    user, err, code = require_auth()
    if err:
        return err, code

    songs = get_downloads(user['id'])
    return jsonify({'songs': songs})


@music_bp.route('/downloads/<int:song_id>', methods=['POST'])
def download_song(song_id):
    user, err, code = require_auth()
    if err:
        return err, code

    count = query_db(
        "SELECT COUNT(*) as cnt FROM downloads WHERE user_id = ?",
        (user['id'],), one=True
    )
    if count and count['cnt'] >= 100:
        return jsonify({
            'error': 'Download limit reached (100 songs)'
        }), 400

    try:
        execute_db(
            "INSERT OR IGNORE INTO downloads (user_id, song_id) VALUES (?, ?)",
            (user['id'], song_id)
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    return jsonify({'success': True})


@music_bp.route('/downloads/<int:song_id>', methods=['DELETE'])
def remove_download(song_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        "DELETE FROM downloads WHERE user_id = ? AND song_id = ?",
        (user['id'], song_id)
    )
    return jsonify({'success': True})


# ── PLAYLISTS ─────────────────────────────────────
@music_bp.route('/playlists', methods=['GET'])
def get_playlists():
    user, err, code = require_auth()
    if err:
        return err, code

    rows = query_db(
        """SELECT p.*,
           (SELECT COUNT(*) FROM playlist_songs
            WHERE playlist_id = p.id) as song_count
           FROM playlists p
           WHERE p.owner_id = ? AND p.is_shared = 0
           ORDER BY p.created_at DESC""",
        (user['id'],)
    )
    return jsonify({'playlists': rows_to_list(rows)})


@music_bp.route('/playlists', methods=['POST'])
def create_playlist():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Playlist name required'}), 400

    playlist_id = execute_db(
        "INSERT INTO playlists (owner_id, name) VALUES (?, ?)",
        (user['id'], name)
    )
    return jsonify({'success': True, 'id': playlist_id}), 201


@music_bp.route('/playlists/<int:playlist_id>', methods=['GET'])
def get_playlist(playlist_id):
    user, err, code = require_auth()
    if err:
        return err, code

    playlist = query_db(
        """SELECT * FROM playlists
           WHERE id = ? AND (owner_id = ? OR shared_with_id = ?)""",
        (playlist_id, user['id'], user['id']), one=True
    )
    if not playlist:
        return jsonify({'error': 'Playlist not found'}), 404

    songs = query_db(
        """SELECT s.*, ps.position, ps.added_by
           FROM playlist_songs ps
           JOIN songs s ON ps.song_id = s.id
           WHERE ps.playlist_id = ?
           ORDER BY ps.position""",
        (playlist_id,)
    )

    return jsonify({
        'playlist': row_to_dict(playlist),
        'songs': rows_to_list(songs)
    })


@music_bp.route('/playlists/<int:playlist_id>', methods=['PUT'])
def update_playlist(playlist_id):
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Name required'}), 400

    execute_db(
        "UPDATE playlists SET name = ? WHERE id = ? AND owner_id = ?",
        (name, playlist_id, user['id'])
    )
    return jsonify({'success': True})


@music_bp.route('/playlists/<int:playlist_id>', methods=['DELETE'])
def delete_playlist(playlist_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        "DELETE FROM playlists WHERE id = ? AND owner_id = ?",
        (playlist_id, user['id'])
    )
    return jsonify({'success': True})


@music_bp.route('/playlists/<int:playlist_id>/songs',
                methods=['POST'])
def add_to_playlist(playlist_id):
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    song_id = data.get('song_id')
    if not song_id:
        return jsonify({'error': 'song_id required'}), 400

    position = query_db(
        """SELECT COUNT(*) as cnt FROM playlist_songs
           WHERE playlist_id = ?""",
        (playlist_id,), one=True
    )['cnt']

    execute_db(
        """INSERT OR IGNORE INTO playlist_songs
           (playlist_id, song_id, added_by, position)
           VALUES (?, ?, ?, ?)""",
        (playlist_id, song_id, user['id'], position)
    )
    return jsonify({'success': True})


@music_bp.route(
    '/playlists/<int:playlist_id>/songs/<int:song_id>',
    methods=['DELETE']
)
def remove_from_playlist(playlist_id, song_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        """DELETE FROM playlist_songs
           WHERE playlist_id = ? AND song_id = ?""",
        (playlist_id, song_id)
    )
    return jsonify({'success': True})


# ── SHARED PLAYLISTS ──────────────────────────────
@music_bp.route('/shared-playlists', methods=['GET'])
def get_shared_playlists():
    user, err, code = require_auth()
    if err:
        return err, code

    rows = query_db(
        """SELECT p.*,
           (SELECT COUNT(*) FROM playlist_songs
            WHERE playlist_id = p.id) as song_count
           FROM playlists p
           WHERE p.is_shared = 1
           AND (p.owner_id = ? OR p.shared_with_id = ?)
           ORDER BY p.created_at DESC""",
        (user['id'], user['id'])
    )
    return jsonify({'playlists': rows_to_list(rows)})


@music_bp.route('/shared-playlists/<int:playlist_id>',
                methods=['DELETE'])
def delete_shared_playlist(playlist_id):
    user, err, code = require_auth()
    if err:
        return err, code

    execute_db(
        """DELETE FROM playlists
           WHERE id = ?
           AND (owner_id = ? OR shared_with_id = ?)""",
        (playlist_id, user['id'], user['id'])
    )
    return jsonify({'success': True})