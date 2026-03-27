#!/bin/bash
# VibeChat Service Management Script

set -e

APP_DIR="/home/ubuntu/vibechat"

case "$1" in
  start)
    echo "🚀 Starting VibeChat services..."
    sudo systemctl start vibechat-backend
    sudo systemctl start vibechat-frontend
    sudo systemctl restart nginx
    echo "✅ Services started"
    sudo systemctl status vibechat-backend vibechat-frontend --no-pager
    ;;
  
  stop)
    echo "⏹️  Stopping VibeChat services..."
    sudo systemctl stop vibechat-backend vibechat-frontend
    echo "✅ Services stopped"
    ;;
  
  restart)
    echo "🔄 Restarting VibeChat services..."
    sudo systemctl restart vibechat-backend
    sudo systemctl restart vibechat-frontend
    sudo systemctl restart nginx
    echo "✅ Services restarted"
    sudo systemctl status vibechat-backend vibechat-frontend --no-pager
    ;;
  
  status)
    echo "📊 VibeChat services status:"
    sudo systemctl status vibechat-backend vibechat-frontend --no-pager || true
    echo ""
    echo "🌐 Nginx status:"
    sudo systemctl status nginx --no-pager || true
    ;;
  
  logs)
    echo "📋 Backend logs:"
    tail -f $APP_DIR/logs/backend.log &
    echo ""
    echo "📋 Frontend logs:"
    tail -f $APP_DIR/logs/frontend.log &
    wait
    ;;
  
  backend-logs)
    tail -f $APP_DIR/logs/backend.log
    ;;
  
  frontend-logs)
    tail -f $APP_DIR/logs/frontend.log
    ;;
  
  update)
    echo "📥 Updating VibeChat..."
    cd $APP_DIR
    git fetch origin main
    git reset --hard origin/main
    
    # Update backend
    cd backend
    source venv/bin/activate
    pip install -q -r requirements.txt
    deactivate
    cd ..
    
    # Update frontend
    cd frontend
    npm ci
    npm run build
    cd ..
    
    echo "🔄 Restarting services..."
    sudo systemctl restart vibechat-backend
    sudo systemctl restart vibechat-frontend
    sudo systemctl restart nginx
    
    echo "✅ Update complete"
    ;;
  
  *)
    echo "VibeChat Service Manager"
    echo "Usage: $0 {start|stop|restart|status|logs|backend-logs|frontend-logs|update}"
    echo ""
    echo "Commands:"
    echo "  start           - Start all services"
    echo "  stop            - Stop all services"
    echo "  restart         - Restart all services"
    echo "  status          - Show service status"
    echo "  logs            - Follow all logs"
    echo "  backend-logs    - Follow backend logs only"
    echo "  frontend-logs   - Follow frontend logs only"
    echo "  update          - Pull latest code and restart services"
    exit 1
    ;;
esac
