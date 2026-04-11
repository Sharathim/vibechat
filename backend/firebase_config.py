"""
Firebase/Google token verification using PyJWT (offline, no googleapis calls at runtime).

Certs are fetched once at startup and cached. Token verification uses local
RSA public key verification via PyJWT — no network calls per request.
"""

import os
import time
import base64
import json
import jwt  # PyJWT
import requests
from cryptography.x509 import load_pem_x509_certificate
from cryptography.hazmat.backends import default_backend

# Config
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', 'vibechat-version-1')
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '').strip()

FIREBASE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v1/certs'

FIREBASE_CERTS_CACHE_PATH = os.getenv('FIREBASE_CERTS_CACHE_PATH', 'database/firebase_certs_cache.json')

# In-memory cache of parsed public keys: {kid: RSAPublicKey}
_firebase_public_keys = {}
_google_public_keys = {}
_certs_loaded = False


# ── CERT LOADING ──────────────────────────────────

def _x509_pem_to_public_key(pem_str: str):
    """Convert an X.509 PEM certificate string to an RSA public key."""
    cert = load_pem_x509_certificate(pem_str.encode('utf-8'), default_backend())
    return cert.public_key()


def _save_certs_to_disk(certs: dict, cache_path: str) -> None:
    """Save raw PEM certs to disk cache."""
    cache_dir = os.path.dirname(cache_path)
    if cache_dir:
        os.makedirs(cache_dir, exist_ok=True)
    payload = {
        'fetched_at': int(time.time()),
        'expires_at': int(time.time()) + 604800,  # 7 days stale TTL
        'certs': certs,
    }
    with open(cache_path, 'w', encoding='utf-8') as f:
        json.dump(payload, f)


def _load_certs_from_disk(cache_path: str) -> dict | None:
    """Load raw PEM certs from disk cache."""
    if not os.path.exists(cache_path):
        return None
    try:
        with open(cache_path, 'r', encoding='utf-8') as f:
            payload = json.load(f)
        certs = payload.get('certs')
        if isinstance(certs, dict) and certs:
            return certs
    except Exception:
        pass
    return None


def _fetch_certs_with_retry(url: str, retries: int = 3, timeout: int = 10) -> dict:
    """Fetch certs from a URL with retries."""
    last_error = Exception('All retries failed')
    for attempt in range(retries):
        try:
            resp = requests.get(url, timeout=timeout)
            resp.raise_for_status()
            certs = resp.json()
            if isinstance(certs, dict) and certs:
                return certs
            raise ValueError('Empty cert response')
        except Exception as e:
            last_error = e
            if attempt < retries - 1:
                time.sleep(1)
    raise last_error


def _parse_pem_certs_to_keys(certs: dict) -> dict:
    """Convert a dict of {kid: PEM_string} to {kid: RSAPublicKey}."""
    keys = {}
    for kid, pem in certs.items():
        try:
            keys[kid] = _x509_pem_to_public_key(pem)
        except Exception as e:
            print(f"Warning: could not parse cert {kid}: {e}")
    return keys


def load_all_certs():
    """
    Load Firebase and Google certs at startup.
    Tries online fetch first, falls back to disk cache.
    """
    global _firebase_public_keys, _google_public_keys, _certs_loaded

    # Firebase certs
    firebase_certs = None
    try:
        firebase_certs = _fetch_certs_with_retry(FIREBASE_CERTS_URL)
        _save_certs_to_disk(firebase_certs, FIREBASE_CERTS_CACHE_PATH)
        print("✅ Firebase certs fetched online")
    except Exception as e:
        print(f"⚠️  Could not fetch Firebase certs online: {e}")
        firebase_certs = _load_certs_from_disk(FIREBASE_CERTS_CACHE_PATH)
        if firebase_certs:
            print("✅ Firebase certs loaded from disk cache")
        else:
            print("❌ No Firebase certs available (online or cached)")

    if firebase_certs:
        _firebase_public_keys = _parse_pem_certs_to_keys(firebase_certs)

    # Google OAuth certs (for GIS tokens)
    if GOOGLE_CLIENT_ID:
        try:
            google_certs = _fetch_certs_with_retry(GOOGLE_CERTS_URL)
            _google_public_keys = _parse_pem_certs_to_keys(google_certs)
            print("✅ Google OAuth certs fetched online")
        except Exception as e:
            print(f"⚠️  Could not fetch Google OAuth certs: {e}")

    _certs_loaded = True


def _ensure_certs_loaded():
    """Ensure certs have been loaded at least once."""
    if not _certs_loaded:
        load_all_certs()


# ── TOKEN VERIFICATION ────────────────────────────

def _decode_unverified_jwt_payload(token: str) -> dict:
    """Decode JWT payload without verification (diagnostics only)."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return {}
        payload = parts[1]
        padding = '=' * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload + padding)
        return json.loads(decoded.decode('utf-8'))
    except Exception:
        return {}


def get_token_debug_info(token: str) -> dict:
    payload = _decode_unverified_jwt_payload(token)
    return {
        'iss': payload.get('iss'),
        'aud': payload.get('aud'),
        'sub': payload.get('sub'),
        'exp': payload.get('exp'),
        'iat': payload.get('iat'),
        'auth_time': payload.get('auth_time'),
        'email': payload.get('email'),
    }


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token using PyJWT (offline RS256 verification).
    No network calls — uses pre-loaded public keys.
    """
    _ensure_certs_loaded()

    if not isinstance(id_token, str) or not id_token.strip():
        raise ValueError('Token is missing or empty')

    if len(id_token.split('.')) != 3:
        raise ValueError('Malformed token: expected JWT with 3 segments')

    if not _firebase_public_keys:
        raise ValueError(
            'No Firebase public keys available. '
            'Certs could not be fetched at startup and no cache exists.'
        )

    # Get the key ID from the token header
    try:
        unverified_header = jwt.get_unverified_header(id_token)
    except jwt.exceptions.DecodeError as e:
        raise ValueError(f'Malformed token header: {e}')

    kid = unverified_header.get('kid')
    if not kid:
        raise ValueError('Token header missing kid (key ID)')

    public_key = _firebase_public_keys.get(kid)
    if not public_key:
        raise ValueError(
            f'Unknown key ID: {kid}. '
            f'Available keys: {list(_firebase_public_keys.keys())}'
        )

    expected_issuer = f'https://securetoken.google.com/{FIREBASE_PROJECT_ID}'

    try:
        claims = jwt.decode(
            id_token,
            key=public_key,
            algorithms=['RS256'],
            audience=FIREBASE_PROJECT_ID,
            issuer=expected_issuer,
            options={
                'verify_exp': True,
                'verify_iat': True,
                'verify_aud': True,
                'verify_iss': True,
                'require': ['exp', 'iat', 'aud', 'iss', 'sub'],
            },
        )
    except jwt.ExpiredSignatureError:
        raise ValueError('ID token has expired')
    except jwt.InvalidAudienceError:
        raise ValueError(f'Audience mismatch: expected {FIREBASE_PROJECT_ID}')
    except jwt.InvalidIssuerError:
        raise ValueError(f'Issuer mismatch: expected {expected_issuer}')
    except jwt.InvalidTokenError as e:
        raise ValueError(f'Token verification failed: {e}')

    # Ensure sub (user ID) is present and non-empty
    if not claims.get('sub'):
        raise ValueError('Token missing sub (subject/user ID)')

    # Add uid alias for compatibility
    claims['uid'] = claims['sub']

    return claims


def _verify_google_oauth_id_token(id_token: str) -> dict:
    """Verify a Google OAuth ID token (issuer: accounts.google.com) using PyJWT."""
    _ensure_certs_loaded()

    if not GOOGLE_CLIENT_ID:
        raise ValueError(
            'GOOGLE_CLIENT_ID is not configured on backend. '
            'Cannot verify Google OAuth ID token.'
        )

    if not _google_public_keys:
        raise ValueError('No Google OAuth public keys available.')

    try:
        unverified_header = jwt.get_unverified_header(id_token)
    except jwt.exceptions.DecodeError as e:
        raise ValueError(f'Malformed token header: {e}')

    kid = unverified_header.get('kid')
    if not kid:
        raise ValueError('Token header missing kid')

    public_key = _google_public_keys.get(kid)
    if not public_key:
        raise ValueError(f'Unknown Google key ID: {kid}')

    try:
        claims = jwt.decode(
            id_token,
            key=public_key,
            algorithms=['RS256'],
            audience=GOOGLE_CLIENT_ID,
            issuer=['accounts.google.com', 'https://accounts.google.com'],
            options={
                'verify_exp': True,
                'verify_aud': True,
                'verify_iss': True,
            },
        )
    except jwt.ExpiredSignatureError:
        raise ValueError('Google OAuth token has expired')
    except jwt.InvalidTokenError as e:
        raise ValueError(f'Google OAuth token verification failed: {e}')

    return claims


def verify_google_login_token(id_token: str) -> tuple[dict, str]:
    """
    Verify either:
    1) Firebase ID token (preferred), or
    2) Google OAuth ID token (GIS flow).

    Returns: (claims, token_type)
    """
    token_debug = get_token_debug_info(id_token)
    issuer = (token_debug.get('iss') or '').strip()

    firebase_issuer = f'https://securetoken.google.com/{FIREBASE_PROJECT_ID}'
    if issuer == firebase_issuer or issuer == f'securetoken.google.com/{FIREBASE_PROJECT_ID}':
        claims = verify_firebase_token(id_token)
        return claims, 'firebase'

    if issuer in ('accounts.google.com', 'https://accounts.google.com'):
        claims = _verify_google_oauth_id_token(id_token)
        return claims, 'google-oauth'

    # Unknown issuer: try Firebase first, then Google OAuth
    firebase_error = None
    try:
        claims = verify_firebase_token(id_token)
        return claims, 'firebase'
    except Exception as e:
        firebase_error = str(e)

    try:
        claims = _verify_google_oauth_id_token(id_token)
        return claims, 'google-oauth'
    except Exception as e:
        raise ValueError(
            'Token verification failed for both Firebase and Google OAuth. '
            f'Issuer={issuer or "unknown"}; '
            f'firebase_error={firebase_error}; '
            f'google_oauth_error={e}'
        )

def refresh_certs_background():
    """
    Background greenthread that refreshes Firebase and Google certs
    every 6 hours so cached keys never go stale.
    """
    import eventlet
    REFRESH_INTERVAL = 6 * 60 * 60  # 6 hours in seconds

    while True:
        eventlet.sleep(REFRESH_INTERVAL)
        print("🔄 Refreshing Firebase/Google certs in background...")
        try:
            global _firebase_public_keys, _google_public_keys

            # Refresh Firebase certs
            try:
                firebase_certs = _fetch_certs_with_retry(FIREBASE_CERTS_URL)
                _save_certs_to_disk(firebase_certs, FIREBASE_CERTS_CACHE_PATH)
                _firebase_public_keys = _parse_pem_certs_to_keys(firebase_certs)
                print("✅ Firebase certs refreshed successfully")
            except Exception as e:
                print(f"⚠️  Background Firebase cert refresh failed: {e}")

            # Refresh Google OAuth certs
            if GOOGLE_CLIENT_ID:
                try:
                    google_certs = _fetch_certs_with_retry(GOOGLE_CERTS_URL)
                    _google_public_keys = _parse_pem_certs_to_keys(google_certs)
                    print("✅ Google OAuth certs refreshed successfully")
                except Exception as e:
                    print(f"⚠️  Background Google cert refresh failed: {e}")

        except Exception as e:
            print(f"❌ Unexpected error in cert refresh background task: {e}")
