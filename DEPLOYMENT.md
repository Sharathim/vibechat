# VibeChat Production Deployment - Quick Start

## What's Been Done ✅

1. **Removed Docker** - Switched to direct EC2 deployment
2. **Updated Ports**
   - Backend: 5006 (was 5001)
   - Frontend: 3006 (was 5173)
3. **Added Nginx Configuration** - Reverse proxy at nginx.conf
4. **GitHub Actions Setup**
   - CI workflow: Runs tests on every push/PR
   - Deploy workflow: Deploys to EC2 on main branch push
5. **EC2 Setup Scripts**
   - `scripts/ec2-setup.sh` - First-time server setup
   - `scripts/manage.sh` - Service management
   - `scripts/github-secrets-setup.sh` - GitHub Actions configuration helper

## Next Steps 📋

### 1. Prepare Your EC2 Instance

1. Launch Ubuntu 22.04 LTS instance on AWS
2. Get your EC2 public IP address
3. Download your SSH key (.pem file)

### 2. Configure GitHub Repository

1. Go to your GitHub repo Settings
2. Navigate to Secrets and variables > Actions
3. Add these secrets:
   - `EC2_HOST`: Your EC2 public IP (e.g., 54.123.456.789)
   - `EC2_USER`: ubuntu
   - `EC2_PRIVATE_KEY`: Full contents of your .pem file

**Help**: Run `bash scripts/github-secrets-setup.sh` locally to see detailed instructions

### 3. Set Up EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Clone your repository
git clone https://github.com/YOUR_USERNAME/vibechat.git ~/vibechat
cd ~/vibechat

# Make scripts executable
chmod +x scripts/ec2-setup.sh scripts/manage.sh

# Run setup (takes ~5-10 minutes)
bash scripts/ec2-setup.sh
```

### 4. Configure Environment Variables

On your EC2 instance:

```bash
# Edit backend environment
nano ~/vibechat/backend/.env
# Add all required variables (see .env.example)

# Edit frontend environment  
nano ~/vibechat/frontend/.env
# Add all required variables (see .env.example)
```

### 5. Start Services

```bash
bash ~/vibechat/scripts/manage.sh start

# Verify services are running
bash ~/vibechat/scripts/manage.sh status

# Check the app is accessible
curl http://your-ec2-ip/health
```

### 6. Push to GitHub & Deploy

```bash
# From your local machine
git push origin main

# GitHub Actions will:
# 1. Run CI tests
# 2. Build the application
# 3. Deploy to your EC2 instance
# 4. Restart services

# Monitor progress in GitHub Actions tab
```

## File Structure Overview

```
vibechat/
├── backend/                 # Flask backend
│   ├── app.py              # Updated: port from config
│   ├── config.py           # Updated: ports 5006, FRONTEND_URL
│   └── .env.example        # NEW: template for environment variables
├── frontend/               # React frontend
│   ├── vite.config.ts      # Updated: port 3006, proxy to 5006
│   ├── src/config.ts       # Updated: API URLs to port 5006
│   └── .env.example        # NEW: template for environment variables
├── nginx.conf              # NEW: Reverse proxy config
├── PRODUCTION.md           # NEW: Detailed production guide
├── .github/
│   └── workflows/
│       ├── ci.yml          # NEW: CI pipeline (test & build)
│       └── deploy.yml      # NEW: Deploy to EC2
└── scripts/
    ├── ec2-setup.sh        # NEW: Initial server setup
    ├── manage.sh           # NEW: Service management
    └── github-secrets-setup.sh  # NEW: Secrets configuration helper
```

## Configuration Variables Summary

### Backend (.env)
```
FLASK_ENV=production          # Set to 'production'
SECRET_KEY=<generate-new>     # Use: python3 -c "import secrets; print(secrets.token_urlsafe(32))"
PORT=5006                     # Backend port
HOST=0.0.0.0                 # Listen on all interfaces
FRONTEND_URL=http://your-ip:80

# Email, AWS, YouTube, Firebase configs...
```

### Frontend (.env)
```
VITE_API_URL=http://your-domain:5006    # Backend URL
VITE_WS_URL=http://your-domain:5006     # WebSocket URL
# Firebase config variables...
```

## Commands Reference

### Deployment
```bash
# On EC2 instance:
bash ~/vibechat/scripts/manage.sh start     # Start services
bash ~/vibechat/scripts/manage.sh stop      # Stop services
bash ~/vibechat/scripts/manage.sh restart   # Restart services
bash ~/vibechat/scripts/manage.sh status    # Check status
bash ~/vibechat/scripts/manage.sh logs      # Follow all logs
bash ~/vibechat/scripts/manage.sh update    # Pull & redeploy (automatic via GitHub)
```

### GitHub Actions
```bash
# From local machine:
git push origin main              # Triggers CI & Deploy
git push origin develop           # Triggers CI only
```

### Service Logs
```bash
# On EC2:
tail -f ~/vibechat/logs/backend.log      # Backend logs
tail -f ~/vibechat/logs/frontend.log     # Frontend logs
sudo tail -f /var/log/nginx/error.log    # Nginx logs
```

## Checklist Before Production

- [ ] Generated new SECRET_KEY for production
- [ ] Added all required .env variables
- [ ] Set FLASK_ENV=production
- [ ] Configured GitHub secrets (EC2_HOST, EC2_USER, EC2_PRIVATE_KEY)
- [ ] Tested SSH connection to EC2
- [ ] Verified services start without errors
- [ ] Tested health endpoint: `curl http://EC2_IP/health`
- [ ] Can access frontend in browser
- [ ] Backend APIs respond correctly
- [ ] Nginx is forwarding requests properly
- [ ] Logs are being written correctly

## Troubleshooting

### Services won't start
```bash
sudo systemctl status vibechat-backend -l
sudo journalctl -u vibechat-backend -n 50
```

### GitHub Actions deployment fails
Check the workflow logs in your GitHub repo Actions tab

### Can't connect to EC2
```bash
# Verify connection works locally first
ssh -i your-key.pem ubuntu@your-ec2-ip "uptime"
```

### Port already in use
```bash
# Check what's using the port
sudo lsof -i :5006     # For backend
sudo lsof -i :3006     # For frontend
sudo lsof -i :80       # For nginx
```

## Additional Resources

- Full guide: See `PRODUCTION.md`
- Port changes: Backend uses 5006, Frontend uses 3006
- Nginx proxies everything through port 80
- GitHub Actions runs on every push to main branch

## Get Help

For detailed instructions on any step, see:
- **PRODUCTION.md** - Full production deployment guide
- **scripts/github-secrets-setup.sh** - Run this for GitHub secrets setup help
- **backend/.env.example** - Environment variable template
- **frontend/.env.example** - Environment variable template

---

**You're ready to deploy!** 🚀

Once EC2 is set up and secrets are configured, just push to main and GitHub Actions will deploy automatically.
