from flask import Blueprint, request, jsonify, session
from .helpers import get_feed
from modules.auth.helpers import get_current_user

feed_bp = Blueprint('feed', __name__)

def require_auth():
    user = get_current_user(session)
    if not user:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return user, None, None


@feed_bp.route('', methods=['GET'])
def get_feed_route():
    user, err, code = require_auth()
    if err:
        return err, code

    page = int(request.args.get('page', 1))
    limit = 20
    offset = (page - 1) * limit

    feed = get_feed(user['id'], limit, offset)
    return jsonify({
        'feed': feed,
        'page': page,
        'has_more': len(feed) == limit,
    })