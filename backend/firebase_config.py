import os
import firebase_admin
from firebase_admin import credentials, auth

# Your Firebase project ID (from firebase.ts config)
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', 'vibechat-version-1')

_app = None

def init_firebase():
    global _app
    if _app:
        return _app

    cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH')

    if cred_path and os.path.exists(cred_path):
        # Use service account JSON file (recommended for production)
        cred = credentials.Certificate(cred_path)
        _app = firebase_admin.initialize_app(cred)
    else:
        # For local development: use project ID only
        # This works for token verification without service account
        try:
            _app = firebase_admin.initialize_app(options={'projectId': FIREBASE_PROJECT_ID})
        except ValueError:
            # App already initialized
            _app = firebase_admin.get_app()

    return _app


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded claims.

    Args:
        id_token: The Firebase ID token to verify

    Returns:
        Decoded token claims including uid, email, name, picture, etc.

    Raises:
        ValueError: If the token is invalid or expired
    """
    import time
    init_firebase()

    # Try verification with retry for minor clock skew
    max_retries = 2
    for attempt in range(max_retries):
        try:
            decoded_token = auth.verify_id_token(id_token, check_revoked=False)
            return decoded_token
        except auth.InvalidIdTokenError as e:
            error_msg = str(e)
            # Handle clock skew - "Token used too early"
            if 'Token used too early' in error_msg and attempt < max_retries - 1:
                time.sleep(1)  # Wait 1 second and retry
                continue
            raise ValueError(f'Invalid ID token: {e}')
        except auth.ExpiredIdTokenError:
            raise ValueError('ID token has expired')
        except auth.RevokedIdTokenError:
            raise ValueError('ID token has been revoked')
        except Exception as e:
            error_msg = str(e)
            if 'Token used too early' in error_msg and attempt < max_retries - 1:
                time.sleep(1)
                continue
            raise ValueError(f'Token verification failed: {e}')
