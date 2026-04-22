# AWS Backend Deployment Guide — Gurukul Academy

> **Budget:** $100 AWS Credits  
> **Estimated monthly cost:** $0 (Free Tier) to ~$4/month (after Free Tier expires)  
> **Time required:** ~30-45 minutes

---

## Cost Breakdown (So You Don't Ruin Anything)

| Service | Free Tier Allowance | Your Usage | Monthly Cost |
|---------|-------------------|------------|-------------|
| EC2 t2.micro | 750 hrs/month for 12 months | 1 instance 24/7 = 730 hrs | **$0** |
| EBS Storage (8 GB) | 30 GB free for 12 months | 8 GB | **$0** |
| Data Transfer | 100 GB/month outbound | ~1-2 GB | **$0** |
| Elastic IP | Free while attached to running instance | 1 IP | **$0** |
| MongoDB Atlas M0 | Forever free | Already set up | **$0** |

> [!CAUTION]
> **Three things that WILL cost money if you're not careful:**
> 1. **Stopping your EC2 but not releasing the Elastic IP** — charges ~$3.6/month
> 2. **Launching a t2.small or bigger** — not free tier, charges ~$17/month
> 3. **Creating multiple EC2 instances** — only 1x t2.micro is free
>
> **Golden rule:** Stick to **1 x t2.micro** and you'll spend **$0** for 12 months.

---

## Prerequisites

Before starting, make sure you have:
- [x] An AWS account (sign up at [aws.amazon.com](https://aws.amazon.com))
- [x] Your $100 credits applied (check in **Billing Dashboard > Credits**)
- [x] Your project pushed to GitHub (private repo is fine)
- [x] MongoDB Atlas already set up (you already have this — your `MONGO_URI` is ready)
- [x] A terminal/SSH client (Windows Terminal, PuTTY, or VS Code Remote SSH)

---

## Step 1: Launch an EC2 Instance

### 1.1 — Open EC2 Dashboard

1. Log in to [AWS Console](https://console.aws.amazon.com)
2. In the search bar at top, type **EC2** and click on it
3. Make sure your **Region** (top-right corner) is set to one close to you:
   - India: **Asia Pacific (Mumbai) — ap-south-1**
   - This reduces latency for your users

### 1.2 — Launch Instance

1. Click the orange **"Launch Instance"** button
2. Fill in the details:

| Setting | Value |
|---------|-------|
| **Name** | `gurukul-backend` |
| **OS Image (AMI)** | Ubuntu Server 24.04 LTS (Free tier eligible) |
| **Instance type** | `t2.micro` (says "Free tier eligible" below it) |
| **Key pair** | Click "Create new key pair" |

### 1.3 — Create Key Pair (This is Your SSH Password)

| Setting | Value |
|---------|-------|
| Key pair name | `gurukul-key` |
| Key pair type | RSA |
| File format | `.pem` (for Mac/Linux/Windows Terminal) |

> [!IMPORTANT]
> A file called `gurukul-key.pem` will download. **Save this file safely** — you CANNOT download it again.  
> Move it to a permanent location like `C:\Users\Atharva\.ssh\gurukul-key.pem`

### 1.4 — Configure Security Group (Firewall Rules)

Under **Network settings**, click **"Edit"** and set up these rules:

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| SSH | 22 | My IP | So only you can SSH in |
| Custom TCP | 5000 | Anywhere (0.0.0.0/0) | Your API port |
| HTTP | 80 | Anywhere (0.0.0.0/0) | For Nginx reverse proxy |
| HTTPS | 443 | Anywhere (0.0.0.0/0) | For SSL (optional, for later) |

### 1.5 — Storage

- Keep the default **8 GB gp3** (well within 30 GB free tier)

### 1.6 — Launch!

- Click **"Launch Instance"**
- Wait 1-2 minutes for it to start
- Go to **EC2 > Instances** and you'll see `gurukul-backend` with state "Running"

---

## Step 2: Assign an Elastic IP (So Your IP Doesn't Change)

Every time you stop/start an EC2, it gets a **new public IP**. An Elastic IP is a static IP that stays the same.

1. In EC2 sidebar, go to **Elastic IPs**
2. Click **"Allocate Elastic IP address"** → Click **"Allocate"**
3. Select the new IP → Click **"Actions" > "Associate Elastic IP address"**
4. Choose your `gurukul-backend` instance → Click **"Associate"**

> [!WARNING]
> An Elastic IP is **free ONLY while attached to a running instance**.  
> If you stop your EC2 instance, either **release** the Elastic IP or know it'll cost ~$0.005/hour (~$3.60/month).

Note down your Elastic IP. Let's call it `YOUR_ELASTIC_IP` (e.g., `13.235.xx.xx`).

---

## Step 3: Connect to Your EC2 via SSH

Open **Windows Terminal** (or PowerShell) and run:

```powershell
ssh -i "C:\Users\Atharva\.ssh\gurukul-key.pem" ubuntu@YOUR_ELASTIC_IP
```

If you get a permissions error on Windows:
```powershell
icacls "C:\Users\Atharva\.ssh\gurukul-key.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

Then try the SSH command again. Type `yes` when it asks about the fingerprint.

**You're now inside your AWS server!**

---

## Step 4: Install Node.js, PM2 & Nginx

Run these commands one by one on your EC2:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node -v    # Should show v20.x.x
npm -v     # Should show 10.x.x

# Install PM2 (keeps your server alive 24/7, auto-restarts on crash)
sudo npm install -g pm2

# Install Nginx (reverse proxy — routes port 80 to your app on port 5000)
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

---

## Step 5: Clone Your Project & Set Up

```bash
# Go to home directory
cd ~

# Clone your repo (replace with your actual GitHub URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Navigate to server folder
cd YOUR_REPO_NAME/server

# Install dependencies
npm install
```

### 5.1 — Create the `.env` File

```bash
nano .env
```

Paste this (use your actual values):

```env
JWT_SECRET=super_secret_production_key_123!
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb+srv://mandleatharva35_db_user:YOUR_PASSWORD@cluster0.lxbzyxa.mongodb.net/gurukul?retryWrites=true&w=majority
PORT=5000
```

> [!TIP]
> In nano: Paste with **right-click**, save with **Ctrl+O → Enter**, exit with **Ctrl+X**

### 5.2 — Seed the Database (if not already done)

```bash
npm run seed
```

You should see:
```
MongoDB Atlas connected successfully.
Seed complete!
  - Admin: username=admin, password=admin123
  - Students: 50 seeded
```

---

## Step 6: Start the Server with PM2

PM2 keeps your Node.js app running even after you close SSH. It auto-restarts on crashes.

```bash
# Start the server
pm2 start server.js --name "gurukul-api"

# Check it's running
pm2 status
```

You should see:

```
┌────┬──────────────┬──────┬──────┬───────────┐
│ id │ name         │ mode │ ↺    │ status    │
├────┼──────────────┼──────┼──────┼───────────┤
│ 0  │ gurukul-api  │ fork │ 0    │ online    │
└────┴──────────────┴──────┴──────┴───────────┘
```

### 6.1 — Essential PM2 Commands

```bash
# View live logs
pm2 logs gurukul-api

# Restart the server
pm2 restart gurukul-api

# Stop the server
pm2 stop gurukul-api

# Make PM2 auto-start on server reboot
pm2 startup
pm2 save
```

> [!IMPORTANT]
> **Run these two commands** so your app survives EC2 reboots:
> ```bash
> pm2 startup
> ```
> Copy-paste the command it outputs (starts with `sudo env PATH=...`), then:
> ```bash
> pm2 save
> ```

---

## Step 7: Set Up Nginx Reverse Proxy

Nginx forwards traffic from port 80 (standard HTTP) to your app on port 5000. This way users access your API at `http://YOUR_ELASTIC_IP` instead of `http://YOUR_ELASTIC_IP:5000`.

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/gurukul
```

Paste this entire block:

```nginx
server {
    listen 80;
    server_name YOUR_ELASTIC_IP;

    # Max upload size (for any future file uploads)
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        # WebSocket support (needed for WhatsApp client)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Forward real client IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }
}
```

Replace `YOUR_ELASTIC_IP` with your actual IP (e.g., `13.235.xx.xx`).

Now activate the config:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/gurukul /etc/nginx/sites-enabled/

# Remove default Nginx page
sudo rm /etc/nginx/sites-enabled/default

# Test config for syntax errors
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 8: Test Your Deployment

### From your local machine (Windows Terminal):

```powershell
# Test root endpoint
Invoke-RestMethod -Uri "http://YOUR_ELASTIC_IP/";

# Test admin login
$body = '{"username":"admin","password":"admin123"}'
Invoke-RestMethod -Uri "http://YOUR_ELASTIC_IP/login/admin" -Method POST -Body $body -ContentType "application/json"
```

You should see:
```json
{ "role": "admin", "message": "Admin login successful", "token": "eyJ..." }
```

### From the EC2 itself:

```bash
curl http://localhost:5000/
# Should return: {"message":"Gurukul Academy API is running."}
```

---

## Step 9: Connect Your Frontend

Once your backend is live at `http://YOUR_ELASTIC_IP`, update your React frontend to point to it.

### Option A: If deploying frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → Settings → Environment Variables
2. Add: `REACT_APP_API_URL` = `http://YOUR_ELASTIC_IP`
3. Redeploy the frontend

### Option B: If updating locally first

In your `client/src/utils/api.js`, update the base URL:

```javascript
const API_BASE = process.env.REACT_APP_API_URL || "http://YOUR_ELASTIC_IP";
```

---

## Step 10: Updating Your Code (Future Deploys)

When you push changes to GitHub, SSH into your EC2 and run:

```bash
cd ~/YOUR_REPO_NAME/server
git pull origin main
npm install          # Only if you added new packages
pm2 restart gurukul-api
```

> [!TIP]
> **Pro move:** Create a deploy script on your EC2:
> ```bash
> nano ~/deploy.sh
> ```
> ```bash
> #!/bin/bash
> cd ~/YOUR_REPO_NAME/server
> git pull origin main
> npm install
> pm2 restart gurukul-api
> echo "Deployed successfully!"
> ```
> ```bash
> chmod +x ~/deploy.sh
> ```
> Now just run `~/deploy.sh` whenever you need to update!

---

## Monitoring & Safety

### Check Your AWS Bill

1. Go to [AWS Billing Dashboard](https://console.aws.amazon.com/billing/)
2. Click **"Bills"** on the left → see current month charges
3. Should show **$0.00** if you're on free tier

### Set Up a Billing Alarm (Highly Recommended)

This sends you an email if your bill goes above a threshold.

1. Go to **CloudWatch** (search in AWS console)
2. Click **Alarms** → **Create Alarm**
3. Select metric → **Billing** → **Total Estimated Charge**
4. Set threshold: **$5** (so you get warned early)
5. Add your email for notifications
6. Create the alarm

> [!IMPORTANT]
> **Set this up immediately.** This is your safety net — you'll get an email before any real money is spent.

---

## Troubleshooting

### "Connection refused" when accessing the API

```bash
# Check if your app is running
pm2 status

# Check PM2 logs for errors
pm2 logs gurukul-api --lines 50

# Check if Nginx is running
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -50 /var/log/nginx/error.log
```

### "Permission denied" on SSH

```powershell
# Fix key permissions on Windows
icacls "C:\Users\Atharva\.ssh\gurukul-key.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

### App crashes on EC2 (out of memory)

t2.micro has only 1 GB RAM. If you hit memory issues:

```bash
# Create a 1GB swap file (acts as extra RAM)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Need to check if port 5000 is open

```bash
sudo ufw status              # Check firewall
sudo lsof -i :5000           # Check what's on port 5000
```

---

## Quick Reference Card

| Action | Command |
|--------|---------|
| SSH into EC2 | `ssh -i "gurukul-key.pem" ubuntu@YOUR_ELASTIC_IP` |
| Check app status | `pm2 status` |
| View live logs | `pm2 logs gurukul-api` |
| Restart app | `pm2 restart gurukul-api` |
| Stop app | `pm2 stop gurukul-api` |
| Update code | `cd ~/REPO/server && git pull && pm2 restart gurukul-api` |
| Check Nginx | `sudo systemctl status nginx` |
| Restart Nginx | `sudo systemctl restart nginx` |
| Check disk space | `df -h` |
| Check memory | `free -m` |

---

## Architecture After Deployment

```
┌──────────────┐         ┌──────────────────────────────┐        ┌─────────────────┐
│              │  HTTP    │  AWS EC2 (t2.micro)          │        │  MongoDB Atlas   │
│   Browser /  │────────→│                              │───────→│  (M0 Free Tier)  │
│   Vercel     │         │  Nginx (:80)                 │        │                  │
│   Frontend   │←────────│    ↓                         │←───────│  gurukul DB      │
│              │         │  Node.js + PM2 (:5000)       │        │                  │
└──────────────┘         └──────────────────────────────┘        └─────────────────┘
```

> **Total monthly cost with $100 credits: $0** for at least 12 months.  
> After free tier: ~$4/month (EC2 t2.micro on-demand), still covered by your credits for **25 months**.
