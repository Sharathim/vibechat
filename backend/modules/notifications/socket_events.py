def register_notification_events(socketio):

    @socketio.on('notification_read')
    def handle_read(data):
        pass

    @socketio.on('request_unread_count')
    def handle_unread_count(data):
        pass