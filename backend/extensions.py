from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt

socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=False,
    engineio_logger=False,
)
bcrypt = Bcrypt()