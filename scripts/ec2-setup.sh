#!/bin/bash
# EC2 Initial Setup Script for VibeChat
# Run this script on a fresh EC2 instance to set up the environment

set -e

echo "🚀 Starting VibeChat EC2 Setup..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Python and pip
echo "🐍 Installing Python..."
sudo apt-get install -y python3.11 python3.11-venv python3-pip
sudo apt-get install -y python3-dev libssl-dev libffi-dev

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx
sudo systemctl enable nginx

# Install PM2 globally for process management
echo "⚙️  Installing PM2..."
sudo npm install -g pm2
pm2 startup
pm2 save

# Install Git
echo "📚 Installing Git..."
sudo apt-get install -y git

# Create app directory and clone repository
APP_DIR="/home/ubuntu/vibechat"
echo "📂 Setting up application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "🔗 Initializing git repository..."
    git init
    git remote add origin https://github.com/YOUR_USERNAME/vibechat.git
    # Note: This would require authentication. Better to clone directly
fi

# Install Python dependencies in virtual environment
echo "📦 Setting up Python virtual environment..."
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
deactivate
cd ..

# Install Node dependencies
echo "📦 Installing Node dependencies..."
cd frontend
npm ci
npm run build
cd ..

# Create .env files from examples
echo "⚙️  Creating environment files..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your configuration"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo "⚠️  Please edit frontend/.env with your configuration"
fi

# Create directories for logs
mkdir -p logs

# Copy Nginx configuration
echo "🌐 Configuring Nginx..."
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl restart nginx

# Create systemd service files
echo "⚙️  Creating systemd service files..."

# Backend service
sudo tee /etc/systemd/system/vibechat-backend.service > /dev/null << EOF
[Unit]
Description=VibeChat Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
ExecStart=$APP_DIR/backend/venv/bin/python app.py
Restart=always
RestartSec=10
StandardOutput=append:$APP_DIR/logs/backend.log
StandardError=append:$APP_DIR/logs/backend.log

[Install]
WantedBy=multi-user.target
EOF

# Frontend service (using preview server)
sudo tee /etc/systemd/system/vibechat-frontend.service > /dev/null << EOF
[Unit]
Description=VibeChat Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$APP_DIR/frontend
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 3006
Restart=always
RestartSec=10
StandardOutput=append:$APP_DIR/logs/frontend.log
StandardError=append:$APP_DIR/logs/frontend.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable services
echo "🔄 Enabling systemd services..."
sudo systemctl daemon-reload
sudo systemctl enable vibechat-backend.service
sudo systemctl enable vibechat-frontend.service

# Create initial start script
echo "✅ VibeChat setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure .env files:"
echo "   - nano $APP_DIR/backend/.env"
echo "   - nano $APP_DIR/frontend/.env"
echo ""
echo "2. Start services:"
echo "   sudo systemctl start vibechat-backend"
echo "   sudo systemctl start vibechat-frontend"
echo ""
echo "3. Check service status:"
echo "   sudo systemctl status vibechat-backend"
echo "   sudo systemctl status vibechat-frontend"
echo ""
echo "4. View logs:"
echo "   tail -f $APP_DIR/logs/backend.log"
echo "   tail -f $APP_DIR/logs/frontend.log"
echo ""
echo "5. Access the app:"
echo "   http://YOUR_EC2_IP"
