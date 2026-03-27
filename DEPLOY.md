# VibeChat - AWS EC2 Deployment Guide

> **Note**: This project has been updated to run without Docker. For the latest production deployment guide, see [PRODUCTION.md](PRODUCTION.md) and [DEPLOYMENT.md](DEPLOYMENT.md).

## Quick Start (New Setup)

The project now uses:
- **Backend**: Python/Flask running on port 5006
- **Frontend**: React/Vite running on port 3006  
- **Proxy**: Nginx reverse proxy on port 80
- **CI/CD**: GitHub Actions for automatic deployment

For quick start, follow [DEPLOYMENT.md](DEPLOYMENT.md) instead.

---

## Prerequisites
- AWS Account
- EC2 instance (Ubuntu 22.04 recommended, t3.micro free tier or t3.small)
- S3 bucket (already configured)
- Firebase project with Google Auth enabled
- GitHub account for CI/CD

---

## Step 1: Launch EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Choose:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance type**: t2.small (minimum) or t2.medium (recommended)
   - **Storage**: 20GB+ SSD
3. **Security Group** - Allow these inbound rules:
   | Port | Protocol | Source | Description |
   |------|----------|--------|-------------|
   | 22   | TCP      | Your IP | SSH |
   | 80   | TCP      | 0.0.0.0/0 | HTTP (Nginx) |
   | 443  | TCP      | 0.0.0.0/0 | HTTPS (optional) |

4. Create/select a key pair and download the `.pem` file
5. Launch and note the **Public IP Address**

---

## Step 2: Connect to EC2

```bash
# Make key file secure
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Step 3: Install Docker on EC2

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose

# Add user to docker group (avoids using sudo)
sudo usermod -aG docker $USER

# Log out and back in for group change to take effect
exit
```

Reconnect via SSH after logging out.

---

## Step 4: Clone Your Project

```bash
# Option A: Clone from GitHub (recommended)
git clone https://github.com/YOUR_USERNAME/vibechat.git
cd vibechat

# Option B: Upload files via SCP (from your local machine)
scp -i your-key.pem -r ./vibechat ubuntu@YOUR_EC2_IP:~/
```

---

## Step 5: Configure Environment

```bash
cd vibechat

# Create .env file from example
cp .env.example .env

# Edit with your values
nano .env
```

**Fill in your `.env` file:**
```env
SECRET_KEY=generate-a-random-string-here
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP

FIREBASE_PROJECT_ID=vibechat-version-1

AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=vibechat-media
AWS_REGION=us-east-1

YOUTUBE_API_KEY=your-youtube-api-key

MAIL_EMAIL=your-email@gmail.com
MAIL_PASSWORD=your-app-password

VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:5001
VITE_WS_URL=ws://YOUR_EC2_PUBLIC_IP:5001
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

---

## Step 6: Upload Firebase Credentials

From your **local machine**:
```bash
scp -i your-key.pem ./firebase-credentials.json ubuntu@YOUR_EC2_IP:~/vibechat/backend/
```

---

## Step 7: Build and Run

```bash
cd ~/vibechat

# Build and start containers
docker-compose up -d --build

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Step 8: Update Firebase Authorized Domains

1. Go to **Firebase Console → Authentication → Settings**
2. Under **Authorized domains**, add:
   - `YOUR_EC2_PUBLIC_IP`
   - Your domain name (if you have one)

---

## Step 9: Verify Deployment

1. Open browser: `http://YOUR_EC2_PUBLIC_IP`
2. You should see the VibeChat login page
3. Test Google OAuth login
4. Test email/password login

---

## Useful Commands

```bash
# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# Rebuild after code changes
docker-compose up -d --build

# Enter backend container shell
docker exec -it vibechat-backend bash

# Check database
docker exec -it vibechat-backend python -c "from database.db import query_db; print(query_db('SELECT * FROM users'))"
```

---

## Optional: Set Up Domain & HTTPS

### Using a Domain Name

1. Get a domain from Route 53 or any registrar
2. Create an A record pointing to your EC2 IP
3. Update `.env`:
   ```env
   FRONTEND_URL=https://yourdomain.com
   VITE_API_URL=https://yourdomain.com
   ```

### Using Let's Encrypt SSL (Free HTTPS)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop docker containers temporarily
docker-compose down

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf to use SSL, then rebuild
docker-compose up -d --build
```

---

## Troubleshooting

### Container won't start
```bash
docker-compose logs backend
```

### Firebase auth errors
- Verify `firebase-credentials.json` exists in `backend/`
- Check Firebase Console → Authorized domains

### Database issues
```bash
# Reset database
docker-compose down -v  # Warning: deletes all data
docker-compose up -d --build
```

### Port already in use
```bash
sudo lsof -i :80
sudo kill -9 <PID>
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    EC2 Instance                      │
│                                                      │
│  ┌──────────────┐      ┌──────────────────────────┐ │
│  │   Frontend   │      │        Backend           │ │
│  │   (nginx)    │─────▶│        (Flask)           │ │
│  │   Port 80    │      │        Port 5001         │ │
│  └──────────────┘      └───────────┬──────────────┘ │
│                                    │                 │
└────────────────────────────────────┼─────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌──────────┐    ┌──────────┐    ┌──────────┐
              │ Firebase │    │   AWS    │    │  SQLite  │
              │  Auth    │    │   S3     │    │    DB    │
              └──────────┘    └──────────┘    └──────────┘
```

---

## Cost Estimate (Monthly)

| Service | Estimated Cost |
|---------|---------------|
| EC2 t2.small | ~$17/month |
| S3 (10GB) | ~$0.25/month |
| Data Transfer | ~$5-10/month |
| **Total** | **~$25/month** |

Use EC2 Spot Instances or Reserved Instances for 50-70% savings.
