"""
Auth routes — Google OAuth-only authentication.

Endpoints:
  POST /auth/google          — Verify Firebase/Google ID token, check if user exists
  POST /auth/check-username  — Check username availability + suggestions
  POST /auth/create-user     — Complete profile and create account
  GET  /auth/me              — Get current session user
  POST /auth/logout          — Clear session
"""

from flask import Blueprint, request, jsonify, session
from .helpers import (
    find_user_by_google_id_or_email,
    is_username_taken,
    generate_username_suggestions,
    hash_password,
    create_user,
    get_current_user,
    format_user_response,
)
from .validators import (
    validate_username,
    validate_name,
    validate_password,
)
from firebase_config import verify_google_login_token, get_token_debug_info

auth_bp = Blueprint('auth', __name__)


# ── GOOGLE AUTH ──────────────────────────────────
@auth_bp.route('/google', methods=['POST'])
def google_auth():
    """
    Receive a Firebase/Google ID token from the frontend.
    Verify it, extract google_id + email, check if user exists.

    Returns:
      - exists=True + user data → frontend redirects to home
      - exists=False + googleId + email → frontend redirects to complete-profile
    """
    data = request.get_json(silent=True) or {}
    id_token = (data.get('idToken') or data.get('token') or '').strip()

    if not id_token:
        return jsonify({'error': 'ID token is required'}), 400

    if len(id_token.split('.')) != 3:
        return jsonify({'error': 'Malformed token. Expected JWT with 3 segments.'}), 400

    try:
        decoded_token, token_type = verify_google_login_token(id_token)

        email = decoded_token.get('email')
        google_id = decoded_token.get('uid') or decoded_token.get('sub')

        if not email:
            return jsonify({'error': 'Email not found in Google account.'}), 400
        if not google_id:
            return jsonify({'error': 'Google account ID not found in token.'}), 400

        # Check if user already exists in PostgreSQL auth DB
        existing_user = find_user_by_google_id_or_email(google_id, email)

        if existing_user:
            # Existing user → set session and return user data
            session['user_id'] = existing_user['id']
            session.permanent = True

            return jsonify({
                'success': True,
                'exists': True,
                'user': format_user_response(existing_user),
                'tokenType': token_type,
            })
        else:
            # New user → return google_id and email for profile completion
            return jsonify({
                'success': True,
                'exists': False,
                'googleId': google_id,
                'email': email,
                'tokenType': token_type,
            })

    except ValueError as e:
        token_debug = get_token_debug_info(id_token)
        print('Google auth token verification failed:', {
            'error': str(e),
            'iss': token_debug.get('iss'),
            'aud': token_debug.get('aud'),
        })
        return jsonify({
            'error': f'Invalid token: {str(e)}',
            'debug': {
                'issuer': token_debug.get('iss'),
                'audience': token_debug.get('aud'),
            }
        }), 401
    except Exception as e:
        print(f"Google auth error: {e}")
        return jsonify({'error': 'Authentication failed. Please try again.'}), 500


# ── CHECK USERNAME ────────────────────────────────
@auth_bp.route('/check-username', methods=['POST'])
def check_username():
    """Check if a username is available. Returns suggestions if taken."""
    data = request.get_json()
    username = (data.get('username') or '').strip().lower()

    valid, msg = validate_username(username)
    if not valid:
        return jsonify({'available': False, 'error': msg})

    taken = is_username_taken(username)
    suggestions = generate_username_suggestions(username) if taken else []

    return jsonify({
        'available': not taken,
        'suggestions': suggestions,
    })


# ── CREATE USER (Complete Profile) ────────────────
@auth_bp.route('/create-user', methods=['POST'])
def create_user_route():
    """
    Complete profile and create account after Google OAuth.

    Expects: googleId, email, name, username, password, confirmPassword
    """
    data = request.get_json()

    google_id = (data.get('googleId') or '').strip()
    email = (data.get('email') or '').strip().lower()
    name = (data.get('name') or '').strip()
    username = (data.get('username') or '').strip().lower()
    password = data.get('password') or ''
    confirm_password = data.get('confirmPassword') or ''

    # Validate required Google OAuth fields
    if not google_id:
        return jsonify({'error': 'Google ID is required'}), 400
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    # Validate form fields
    for validator, value in [
        (validate_name, name),
        (validate_username, username),
        (validate_password, password),
    ]:
        valid, msg = validator(value)
        if not valid:
            return jsonify({'error': msg}), 400

    # Check passwords match
    if password != confirm_password:
        return jsonify({'error': 'Passwords do not match'}), 400

    # Check if user already exists
    existing = find_user_by_google_id_or_email(google_id, email)
    if existing:
        return jsonify({'error': 'An account with this Google account already exists'}), 400

    # Check username availability
    if is_username_taken(username):
        suggestions = generate_username_suggestions(username)
        return jsonify({
            'error': 'Username already taken',
            'suggestions': suggestions,
        }), 400

    # Create user
    try:
        password_hash = hash_password(password)
        user_id = create_user(google_id, email, name, username, password_hash)

        # Set session
        session['user_id'] = user_id
        session.permanent = True

        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'user': {
                'id': user_id,
                'google_id': google_id,
                'email': email,
                'name': name,
                'username': username,
            },
        }), 201

    except Exception as e:
        print(f"Create user error: {e}")
        return jsonify({'error': 'Failed to create account. Please try again.'}), 500


# ── ME (get current user) ─────────────────────────
@auth_bp.route('/me', methods=['GET'])
def me():
    user = get_current_user(session)
    if not user:
        return jsonify({'error': 'Not authenticated'}), 401
    return jsonify({'user': format_user_response(user)})


# ── LOGOUT ────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})
