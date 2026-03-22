from flask_socketio import SocketIO
from flask_bcrypt import Bcrypt
from flask_mail import Mail

socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=False,
    engineio_logger=False,
)
bcrypt = Bcrypt()
mail = Mail()