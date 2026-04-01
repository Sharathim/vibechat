import os
from dotenv import load_dotenv

load_dotenv()


def _parse_origins(origins_raw):
    return [origin.strip().rstrip('/') for origin in origins_raw.split(',') if origin.strip()]

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')

    # Database (SQLite — existing app data)
    DATABASE_PATH = os.getenv('DATABASE_PATH', 'database/vibechat.db')

    # PostgreSQL Auth Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://vibechat:vibechat_secret@localhost:5432/vibechat_auth')

    # Email
    MAIL_EMAIL = os.getenv('MAIL_EMAIL', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')

    # YouTube API
    YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')

    # AWS S3
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    AWS_BUCKET_NAME = os.getenv('AWS_BUCKET_NAME', 'vibechat-media')
    AWS_REGION = os.getenv('AWS_REGION', 'ap-south-1')

    # CORS
    _frontend_urls_raw = os.getenv('FRONTEND_URLS', '').strip()
    _frontend_url_single = os.getenv('FRONTEND_URL', 'http://localhost:7001').strip().rstrip('/')

    FRONTEND_URLS = (
        _parse_origins(_frontend_urls_raw)
        if _frontend_urls_raw
        else [_frontend_url_single, 'http://localhost:7001', 'http://127.0.0.1:7001']
    )
    FRONTEND_URLS = list(dict.fromkeys(FRONTEND_URLS))

    # Backward-compatible single-url setting used in a few places.
    FRONTEND_URL = FRONTEND_URLS[0]
    
    # Server
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 7002))

    # Session cookie behavior (important for cross-origin frontend/backend)
    SESSION_COOKIE_NAME = os.getenv('SESSION_COOKIE_NAME', 'vibechat_session')
    SESSION_COOKIE_HTTPONLY = os.getenv('SESSION_COOKIE_HTTPONLY', 'true').lower() == 'true'
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'false').lower() == 'true'
    SESSION_COOKIE_SAMESITE = os.getenv('SESSION_COOKIE_SAMESITE', 'Lax')