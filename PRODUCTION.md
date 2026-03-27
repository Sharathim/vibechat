# VibeChat Production Deployment Guide

This guide covers deploying VibeChat to AWS EC2 with CI/CD using GitHub Actions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [EC2 Setup](#ec2-setup)
3. [Environment Configuration](#environment-configuration)
4. [GitHub Actions Setup](#github-actions-setup)
5. [Deployment](#deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required
- AWS account with EC2 access
- GitHub account with repository access
- SSH key pair for EC2 (PEM file)
- Domain name (optional, can use IP address)

### Recommended
- Ubuntu 20.04 LTS or later EC2 instance (at least t3.micro)
- Security group configured to allow:
  - SSH (port 22) from your location
  - HTTP (port 80) from anywhere
  - HTTPS (port 443) from anywhere (if using SSL later)

## EC2 Setup

### 1. Launch EC2 Instance

```bash
# Recommended settings:
- AMI: Ubuntu Server 22.04 LTS (ami-0c55b159cbfafe1f0 or latest)
- Instance Type: t3.micro (free tier eligible) or t3.small
- Root Volume: 20-30 GB gp3
- Security Group: Allow SSH (22), HTTP (80)
```

### 2. Connect to Your Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### 3. Run Initial Setup Script

```bash
# First, clone your repository or upload the scripts
git clone https://github.com/YOUR_USERNAME/vibechat.git ~/vibechat
cd ~/vibechat

# Make scripts executable
chmod +x scripts/ec2-setup.sh
chmod +x scripts/manage.sh
chmod +x scripts/github-secrets-setup.sh

# Run the setup script
bash scripts/ec2-setup.sh
```

This will:
- Update system packages
- Install Python 3.11, Node.js 18, Nginx, PM2
- Create Python virtual environment
- Install dependencies
- Set up systemd services
- Configure Nginx

## Environment Configuration

### Backend Configuration

After initial setup, configure `.env` file:

```bash
nano ~/vibechat/backend/.env
```

Required variables:
```
FLASK_ENV=production
SECRET_KEY=your-very-secret-key-here
HOST=0.0.0.0
PORT=5006
FRONTEND_URL=http://your-domain-or-ip:80

# Email (Gmail)
MAIL_EMAIL=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# YouTube API
YOUTUBE_API_KEY=your-key

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name
AWS_REGION=ap-south-1

# Database
DATABASE_PATH=database/vibechat.db
```

**Important**: Generate a strong SECRET_KEY:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Frontend Configuration

```bash
nano ~/vibechat/frontend/.env
```

Required variables:
```
VITE_API_URL=http://your-domain-or-ip:5006
VITE_WS_URL=http://your-domain-or-ip:5006

# Firebase credentials
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-id
VITE_FIREBASE_APP_ID=your-app-id
```

## GitHub Actions Setup

### 1. Configure Repository Secrets

Go to your GitHub repository:
```
Settings > Secrets and variables > Actions > New repository secret
```

Add these secrets:

**EC2_HOST**: Your EC2 public IP address
```
54.123.456.789
```

**EC2_USER**: SSH user (usually 'ubuntu')
```
ubuntu
```

**EC2_PRIVATE_KEY**: Contents of your .pem file
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA... (entire contents of .pem file)
-----END RSA PRIVATE KEY-----
```

### 2. Test SSH Connection (Local Machine)

Before deploying, verify SSH works:

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip "echo 'SSH works!'"
```

### 3. GitHub Actions Workflows

Two workflows are configured:

#### CI Workflow (`.github/workflows/ci.yml`)
- Runs on: Push to main/develop, Pull requests
- Actions:
  - Lint Python backend
  - Build frontend
  - Run tests

#### Deploy Workflow (`.github/workflows/deploy.yml`)
- Runs on: Push to main branch
- Actions:
  - Build frontend
  - Deploy to EC2
  - Restart services

## Deployment

### Manual Deployment

**First Time Setup:**
```bash
# On EC2
cd ~/vibechat

# Configure environment files
nano backend/.env
nano frontend/.env

# Start services
bash scripts/manage.sh start

# Verify services are running
bash scripts/manage.sh status
```

**Update After Code Changes:**
```bash
bash scripts/manage.sh update
```

### Automatic Deployment (GitHub Actions)

1. Push changes to main branch:
```bash
git push origin main
```

2. GitHub Actions will:
   - Run CI tests
   - Build frontend
   - Deploy to EC2
   - Restart services

3. Check deployment status:
   - Go to GitHub Actions tab
   - Click on the workflow run
   - View logs for details

### Service Management

```bash
# Start all services
sudo systemctl start vibechat-backend
sudo systemctl start vibechat-frontend
sudo systemctl restart nginx

# Stop services
sudo systemctl stop vibechat-backend
sudo systemctl stop vibechat-frontend

# Restart services
sudo systemctl restart vibechat-backend
sudo systemctl restart vibechat-frontend
sudo systemctl restart nginx

# Check status
sudo systemctl status vibechat-backend
sudo systemctl status vibechat-frontend
sudo systemctl status nginx

# View logs
tail -f /home/ubuntu/vibechat/logs/backend.log
tail -f /home/ubuntu/vibechat/logs/frontend.log
sudo tail -f /var/log/nginx/error.log
```

## Monitoring & Maintenance

### Check Application Status

```bash
# Health check
curl http://your-ec2-ip/health

# Check if services are running
ps aux | grep "python|npm"
```

### View Logs

```bash
# Backend logs
tail -f ~/vibechat/logs/backend.log

# Frontend logs
tail -f ~/vibechat/logs/frontend.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Backups

VibeChat currently uses SQLite. Regular backups recommended:

```bash
# Manual backup
cp ~/vibechat/database/vibechat.db ~/vibechat/database/vibechat.db.backup

# Or use a cron job for automatic backups
# Add to crontab: crontab -e
0 2 * * * cp /home/ubuntu/vibechat/database/vibechat.db /home/ubuntu/backups/vibechat.db.$(date +\%Y\%m\%d)
```

### SSL/HTTPS Setup (Future Enhancement)

To add SSL with Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Update Nginx config to use certificate
# Then modify ~/vibechat/nginx.conf to redirect HTTP to HTTPS
```

## Troubleshooting

### Services Won't Start

1. **Check systemd status:**
   ```bash
   sudo systemctl status vibechat-backend -l
   sudo journalctl -u vibechat-backend -n 50
   ```

2. **Check for port conflicts:**
   ```bash
   sudo lsof -i :5006  # Backend
   sudo lsof -i :3006  # Frontend
   sudo lsof -i :80    # Nginx
   ```

3. **Check environment files:**
   ```bash
   env | grep VITE_
   cat backend/.env | head -20
   ```

### GitHub Actions Deployment Fails

1. **SSH authentication error:**
   - Verify EC2_PRIVATE_KEY secret contains full .pem file
   - Check EC2_HOST and EC2_USER are correct
   - Ensure EC2 security group allows SSH from GitHub Actions IPs

2. **Build failures:**
   - Check workflow logs in GitHub Actions tab
   - Ensure dependencies are in requirements.txt
   - Verify npm packages are locked in package-lock.json

3. **Service restart fails:**
   - Check disk space: `df -h`
   - Check for processes still using ports
   - Stop services manually and check logs

### Nginx Not Working

```bash
# Test Nginx configuration
sudo nginx -t

# Check if Nginx is running
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Database Issues

```bash
# Check database exists and has correct permissions
ls -la ~/vibechat/database/

# If database is corrupted, you can regenerate it:
cd ~/vibechat/backend
source venv/bin/activate
python
> from database.db import init_db
> init_db()
```

### Out of Memory / Disk Space

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Clean up
rm -rf ~/vibechat/frontend/node_modules/.cache/*
sudo journalctl --vacuum=size=100M

# If running low on space, consider upgrading instance volume
```

## Security Checklist

- [ ] Changed default SECRET_KEY in backend/.env
- [ ] Updated MAIL_PASSWORD with app-specific password
- [ ] Secured AWS credentials (use IAM roles if possible)
- [ ] Disabled password SSH (key-only authentication)
- [ ] Configured firewall to limit access
- [ ] Enabled automatic security updates
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity
- [ ] Use strong Firebase API keys
- [ ] Keep dependencies updated

## Performance Tuning

### Nginx Configuration
- Current setup uses gzip compression
- Static files are cached
- WebSocket connections use long polling/polling

### Backend Optimization
- Use production WSGI server (gunicorn):
  ```bash
  pip install gunicorn
  # Update systemd service to use gunicorn instead of Flask dev server
  ```

### Database
- Consider PostgreSQL for production instead of SQLite
- Regular vacuum and optimize operations
- Monitor slow queries

## Scaling Considerations

For higher traffic:

1. **Multiple Backends:**
   - Run multiple Flask instances
   - Use load balancer (Nginx can do this)
   - Sync Socket.IO across instances

2. **Separate Database:**
   - Migrate from SQLite to PostgreSQL/MySQL
   - Set up replication

3. **CDN/Static Files:**
   - Store media on S3 (already implemented)
   - Use CloudFront for distribution

4. **Caching:**
   - Add Redis for session/cache storage
   - Implement cache headers

## Support & Documentation

- Backend: `/api/health` - Health check endpoint
- Frontend: Built with React + TypeScript
- Chat: Real-time Socket.IO
- API Base: `/api/` prefix

For issues, check:
1. Service logs in ~/vibechat/logs/
2. GitHub Actions workflow runs
3. AWS CloudWatch (if enabled)
4. Nginx error logs

---

**Last Updated**: March 2026
**VibeChat Version**: 2.0
