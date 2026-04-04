from flask import Blueprint, request, jsonify, session, Response, stream_with_context
from .helpers import (
    get_or_create_song_pg, get_liked_songs,
    get_listening_history, log_play
)
from .youtube_api import search_songs
from .ytdlp import get_audio_stream_url, get_song_metadata
from database.pg_db import execute_pg, query_pg
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

    audio_url, error = get_audio_stream_url(youtube_id)
    if error:
        return jsonify({'error': error}), 400

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
        }
    )


# ── UPSERT SONG (on select) ───────────────────────
@music_bp.route('/songs', methods=['POST'])
def upsert_song():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    youtube_id = data.get('youtube_id')
    if not youtube_id:
        return jsonify({'error': 'youtube_id is required'}), 400

    # Fetch metadata using yt-dlp
    metadata = get_song_metadata(youtube_id)
    if not metadata:
        return jsonify({'error': 'Could not retrieve song metadata'}), 404

    # Insert into DB
    song = get_or_create_song_pg(
        youtube_id=metadata['youtube_id'],
        title=metadata['title'],
        artist=metadata['artist'],
        duration=metadata['duration'],
        thumbnail_url=metadata['thumbnail_url'],
        tags=metadata.get('tags'),
        youtube_like_count=metadata.get('like_count')
    )

    return jsonify({'song': song}), 200


# ── LOG PLAY ──────────────────────────────────────
@music_bp.route('/history', methods=['POST'])
def add_to_history():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    youtube_id = data.get('youtube_id')
    if not youtube_id:
        return jsonify({'error': 'youtube_id required'}), 400

    log_play(user['id'], youtube_id)
    return jsonify({'success': True})


# ── GET HISTORY ───────────────────────────────────
@music_bp.route('/history', methods=['GET'])
def get_history():
    user, err, code = require_auth()
    if err:
        return err, code

    history = get_listening_history(user['id'])
    return jsonify({'history': history})


# ── LIKED SONGS ───────────────────────────────────
@music_bp.route('/liked', methods=['GET'])
def get_liked():
    user, err, code = require_auth()
    if err:
        return err, code

    songs = get_liked_songs(user['id'])
    return jsonify({'songs': songs})


@music_bp.route('/liked/<youtube_id>', methods=['POST'])
def like_song(youtube_id):
    user, err, code = require_auth()
    if err:
        return err, code

    try:
        # Increment vibechat_like_count
        execute_pg(
            "UPDATE songs SET vibechat_like_count = vibechat_like_count + 1 WHERE youtube_id = %s",
            (youtube_id,)
        )
        # Add to liked_songs table
        execute_pg(
            "INSERT INTO liked_songs (user_id, song_youtube_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (user['id'], youtube_id)
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    return jsonify({'success': True, 'liked': True})


@music_bp.route('/liked/<youtube_id>', methods=['DELETE'])
def unlike_song(youtube_id):
    user, err, code = require_auth()
    if err:
        return err, code

    # Decrement vibechat_like_count
    execute_pg(
        "UPDATE songs SET vibechat_like_count = GREATEST(0, vibechat_like_count - 1) WHERE youtube_id = %s",
        (youtube_id,)
    )
    # Remove from liked_songs table
    execute_pg(
        "DELETE FROM liked_songs WHERE user_id = %s AND song_youtube_id = %s",
        (user['id'], youtube_id)
    )
    return jsonify({'success': True, 'liked': False})