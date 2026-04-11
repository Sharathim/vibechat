from flask import Blueprint, request, jsonify, session, Response, stream_with_context
from .helpers import (
    ensure_song_record, get_liked_songs,
    get_downloads, get_listening_history, log_play
)
from .ytdlp import get_audio_url, get_song_info
from database.pg_db import execute_pg, query_pg, row_to_dict, rows_to_list
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
        response = req.get(url, timeout=5, headers={'User-Agent': 'Mozilla/5.0'})
        return Response(response.content, content_type=response.headers.get('content-type', 'image/jpeg'))
    except Exception:
        return '', 404


@music_bp.route('/stream/<youtube_id>')
def stream_song(youtube_id):
    user, err, code = require_auth()
    if err:
        return err, code

    pg_song = query_pg(
        "SELECT youtube_id FROM songs WHERE youtube_id = %s",
        (youtube_id,), one=True
    )
    if not pg_song:
        metadata = get_song_info(youtube_id)
        if metadata:
            ensure_song_record(
                youtube_id=metadata['youtube_id'],
                title=metadata['title'],
                artist=metadata.get('artist') or metadata.get('tags', []),
                duration=metadata.get('duration', 0),
                thumbnail_url=metadata.get('thumbnail_url', ''),
                youtube_like_count=metadata.get('youtube_like_count', 0),
                tags=metadata.get('tags', []),
            )

    song = query_pg(
        "SELECT * FROM songs WHERE youtube_id = %s",
        (youtube_id,), one=True
    )

    if song:
        song = row_to_dict(song)
        yt_id = song.get('youtube_id', youtube_id)
        if song.get('s3_audio_url'):
            return jsonify({'audio_url': song['s3_audio_url']})
    else:
        yt_id = youtube_id

    audio_url, error = get_audio_url(yt_id)
    if error:
        return jsonify({'error': error}), 400

    def generate():
        try:
            headers = {'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.youtube.com/'}
            with req.get(audio_url, stream=True, headers=headers, timeout=30) as r:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        yield chunk
        except Exception as e:
            print(f"Stream error: {e}")

    try:
        head = req.head(audio_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
        content_type = head.headers.get('content-type', 'audio/webm')
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


@music_bp.route('/history', methods=['POST'])
def add_to_history():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json() or {}
    song_id = data.get('song_id')
    youtube_id = data.get('youtube_id')

    if not song_id and not youtube_id:
        return jsonify({'error': 'song_id required'}), 400

    if not song_id and youtube_id:
        legacy_song = query_pg(
            "SELECT id FROM songs WHERE youtube_id = %s",
            (youtube_id,), one=True
        )
        if not legacy_song:
            metadata = get_song_info(youtube_id)
            if metadata:
                ensure_song_record(
                    youtube_id=metadata['youtube_id'],
                    title=metadata['title'],
                    tags=metadata.get('tags', []),
                    duration=metadata.get('duration', 0),
                    thumbnail_url=metadata.get('thumbnail_url', ''),
                    youtube_like_count=metadata.get('youtube_like_count', 0),
                )
            legacy_song = query_pg(
                "SELECT id FROM songs WHERE youtube_id = %s",
                (youtube_id,), one=True
            )
        if legacy_song:
            song_id = legacy_song['id']

    log_play(user['id'], song_id)
    return jsonify({'success': True})


@music_bp.route('/history', methods=['GET'])
def get_history():
    user, err, code = require_auth()
    if err:
        return err, code
    history = get_listening_history(user['id'])
    return jsonify({'history': history})


@music_bp.route('/history/<int:history_id>', methods=['DELETE'])
def delete_history_item(history_id):
    user, err, code = require_auth()
    if err:
        return err, code
    execute_pg(
        "DELETE FROM listening_history WHERE id = %s AND user_id = %s",
        (history_id, user['id'])
    )
    return jsonify({'success': True})


@music_bp.route('/history/all', methods=['DELETE'])
def clear_history():
    user, err, code = require_auth()
    if err:
        return err, code
    execute_pg("DELETE FROM listening_history WHERE user_id = %s", (user['id'],))
    return jsonify({'success': True})


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
        execute_pg(
            """INSERT INTO liked_songs (user_id, song_id)
               VALUES (%s, %s) ON CONFLICT DO NOTHING""",
            (user['id'], song_id)
        )
        execute_pg(
            """INSERT INTO feed_activity (user_id, song_id, activity_type)
               VALUES (%s, %s, 'like') ON CONFLICT DO NOTHING""",
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
    execute_pg("DELETE FROM liked_songs WHERE user_id = %s AND song_id = %s", (user['id'], song_id))
    execute_pg(
        "DELETE FROM feed_activity WHERE user_id = %s AND song_id = %s AND activity_type = 'like'",
        (user['id'], song_id)
    )
    return jsonify({'success': True, 'liked': False})


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
    count = query_pg(
        "SELECT COUNT(*) as cnt FROM downloads WHERE user_id = %s",
        (user['id'],), one=True
    )
    if count and count['cnt'] >= 100:
        return jsonify({'error': 'Download limit reached (100 songs)'}), 400
    try:
        execute_pg(
            "INSERT INTO downloads (user_id, song_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
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
    execute_pg("DELETE FROM downloads WHERE user_id = %s AND song_id = %s", (user['id'], song_id))
    return jsonify({'success': True})


@music_bp.route('/playlists', methods=['GET'])
def get_playlists():
    user, err, code = require_auth()
    if err:
        return err, code
    rows = query_pg(
        """SELECT p.*,
           (SELECT COUNT(*) FROM playlist_songs
            WHERE playlist_id = p.id) as song_count
           FROM playlists p
           WHERE p.owner_id = %s AND p.is_shared = FALSE
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
    playlist_id = execute_pg(
        "INSERT INTO playlists (owner_id, name) VALUES (%s, %s) RETURNING id",
        (user['id'], name)
    )
    return jsonify({'success': True, 'id': playlist_id}), 201


@music_bp.route('/playlists/<int:playlist_id>', methods=['GET'])
def get_playlist(playlist_id):
    user, err, code = require_auth()
    if err:
        return err, code
    playlist = query_pg(
        "SELECT * FROM playlists WHERE id = %s AND (owner_id = %s OR shared_with_id = %s)",
        (playlist_id, user['id'], user['id']), one=True
    )
    if not playlist:
        return jsonify({'error': 'Playlist not found'}), 404
    songs = query_pg(
        """SELECT s.*, ps.position, ps.added_by
           FROM playlist_songs ps
           JOIN songs s ON ps.song_id = s.id
           WHERE ps.playlist_id = %s
           ORDER BY ps.position""",
        (playlist_id,)
    )
    return jsonify({'playlist': row_to_dict(playlist), 'songs': rows_to_list(songs)})


@music_bp.route('/playlists/<int:playlist_id>', methods=['PUT'])
def update_playlist(playlist_id):
    user, err, code = require_auth()
    if err:
        return err, code
    data = request.get_json()
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Name required'}), 400
    execute_pg(
        "UPDATE playlists SET name = %s WHERE id = %s AND owner_id = %s",
        (name, playlist_id, user['id'])
    )
    return jsonify({'success': True})


@music_bp.route('/playlists/<int:playlist_id>', methods=['DELETE'])
def delete_playlist(playlist_id):
    user, err, code = require_auth()
    if err:
        return err, code
    execute_pg(
        "DELETE FROM playlists WHERE id = %s AND owner_id = %s",
        (playlist_id, user['id'])
    )
    return jsonify({'success': True})


@music_bp.route('/playlists/<int:playlist_id>/songs', methods=['POST'])
def add_to_playlist(playlist_id):
    user, err, code = require_auth()
    if err:
        return err, code
    data = request.get_json()
    song_id = data.get('song_id')
    if not song_id:
        return jsonify({'error': 'song_id required'}), 400
    position = query_pg(
        "SELECT COUNT(*) as cnt FROM playlist_songs WHERE playlist_id = %s",
        (playlist_id,), one=True
    )['cnt']
    execute_pg(
        """INSERT INTO playlist_songs (playlist_id, song_id, added_by, position)
           VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING""",
        (playlist_id, song_id, user['id'], position)
    )
    return jsonify({'success': True})


@music_bp.route('/playlists/<int:playlist_id>/songs/<int:song_id>', methods=['DELETE'])
def remove_from_playlist(playlist_id, song_id):
    user, err, code = require_auth()
    if err:
        return err, code
    execute_pg(
        "DELETE FROM playlist_songs WHERE playlist_id = %s AND song_id = %s",
        (playlist_id, song_id)
    )
    return jsonify({'success': True})


@music_bp.route('/shared-playlists', methods=['GET'])
def get_shared_playlists():
    user, err, code = require_auth()
    if err:
        return err, code
    rows = query_pg(
        """SELECT p.*,
           (SELECT COUNT(*) FROM playlist_songs
            WHERE playlist_id = p.id) as song_count
           FROM playlists p
           WHERE p.is_shared = TRUE
           AND (p.owner_id = %s OR p.shared_with_id = %s)
           ORDER BY p.created_at DESC""",
        (user['id'], user['id'])
    )
    return jsonify({'playlists': rows_to_list(rows)})


@music_bp.route('/shared-playlists/<int:playlist_id>', methods=['DELETE'])
def delete_shared_playlist(playlist_id):
    user, err, code = require_auth()
    if err:
        return err, code
    execute_pg(
        "DELETE FROM playlists WHERE id = %s AND (owner_id = %s OR shared_with_id = %s)",
        (playlist_id, user['id'], user['id'])
    )
    return jsonify({'success': True})