from flask import Blueprint, request, jsonify, session
from .helpers import (
    get_active_clips, create_clip,
    mark_clip_viewed, delete_clip
)
from modules.auth.helpers import get_current_user

clips_bp = Blueprint('clips', __name__)

def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


@clips_bp.route('', methods=['GET'])
def get_clips():
    user, err, code = require_auth()
    if err:
        return err, code

    clips = get_active_clips(user['id'])
    return jsonify({'clips': clips})


@clips_bp.route('', methods=['POST'])
def post_clip():
    user, err, code = require_auth()
    if err:
        return err, code

    data = request.get_json()
    song_id = data.get('song_id')
    start_seconds = data.get('start_seconds', 0)
    end_seconds = start_seconds + 30

    if not song_id:
        return jsonify({'error': 'song_id required'}), 400

    clip_id = create_clip(
        user['id'], song_id,
        start_seconds, end_seconds
    )
    return jsonify({'success': True, 'id': clip_id}), 201


@clips_bp.route('/<int:clip_id>/view', methods=['POST'])
def view_clip(clip_id):
    user, err, code = require_auth()
    if err:
        return err, code

    mark_clip_viewed(clip_id, user['id'])
    return jsonify({'success': True})


@clips_bp.route('/<int:clip_id>', methods=['DELETE'])
def remove_clip(clip_id):
    user, err, code = require_auth()
    if err:
        return err, code

    delete_clip(clip_id, user['id'])
    return jsonify({'success': True})