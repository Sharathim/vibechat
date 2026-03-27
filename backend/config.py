import os
from dotenv import load_dotenv

load_dotenv()


def _parse_origins(origins_raw):
    return [origin.strip().rstrip('/') for origin in origins_raw.split(',') if origin.strip()]

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')

    # Database
    DATABASE_PATH = os.getenv('DATABASE_PATH', 'database/vibechat.db')

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
    _frontend_url_single = os.getenv('FRONTEND_URL', 'http://localhost:3006').strip().rstrip('/')

    FRONTEND_URLS = (
        _parse_origins(_frontend_urls_raw)
        if _frontend_urls_raw
        else [_frontend_url_single, 'http://localhost:3006', 'http://127.0.0.1:3006']
    )
    FRONTEND_URLS = list(dict.fromkeys(FRONTEND_URLS))

    # Backward-compatible single-url setting used in a few places.
    FRONTEND_URL = FRONTEND_URLS[0]
    
    # Server
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5006))