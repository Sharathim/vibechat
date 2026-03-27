import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_cors import CORS
from config import Config
from extensions import socketio, bcrypt, mail
from database.db import init_db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Additional Flask-Mail config
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = Config.MAIL_EMAIL
    app.config['MAIL_PASSWORD'] = Config.MAIL_PASSWORD
    app.config['MAIL_DEFAULT_SENDER'] = Config.MAIL_EMAIL

    # CORS
    CORS(app,
            origins=Config.FRONTEND_URLS,
         supports_credentials=True)

    # Extensions
    bcrypt.init_app(app)
    mail.init_app(app)
    socketio.init_app(app,
                      cors_allowed_origins=Config.FRONTEND_URLS)

    # Register blueprints
    from modules.auth.routes import auth_bp
    from modules.users.routes import users_bp
    from modules.music.routes import music_bp
    from modules.search.routes import search_bp
    from modules.chat.routes import chat_bp
    from modules.vibe.routes import vibe_bp
    from modules.feed.routes import feed_bp
    from modules.clips.routes import clips_bp
    from modules.notifications.routes import notifications_bp
    from modules.settings.routes import settings_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(users_bp, url_prefix='/api')
    app.register_blueprint(music_bp, url_prefix='/api/music')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(vibe_bp, url_prefix='/api/vibe')
    app.register_blueprint(feed_bp, url_prefix='/api/feed')
    app.register_blueprint(clips_bp, url_prefix='/api/clips')
    app.register_blueprint(notifications_bp,
                           url_prefix='/api/notifications')
    app.register_blueprint(settings_bp,
                           url_prefix='/api/settings')

    # Register socket events
    from modules.chat.socket_events import register_chat_events
    from modules.vibe.socket_events import register_vibe_events
    from modules.notifications.socket_events import register_notification_events

    register_chat_events(socketio)
    register_vibe_events(socketio)
    register_notification_events(socketio)

    @app.route('/health')
    def health():
        return {'status': 'ok', 'message': 'VibeChat API running'}

    return app

if __name__ == '__main__':
    app = create_app()
    init_db()
    print("🎵 VibeChat backend starting...")
    socketio.run(app,
                 host=app.config['HOST'],
                 port=app.config['PORT'],
                 debug=app.config['FLASK_ENV'] == 'development')