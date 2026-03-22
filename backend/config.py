import os
from dotenv import load_dotenv

load_dotenv()

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
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')