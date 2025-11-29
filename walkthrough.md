# Local Network Deployment Walkthrough

Step-by-step guide for deploying **Attendance Processor Web** on a local network server.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Setup](#2-project-setup)
3. [Environment Variables](#3-environment-variables)
4. [Database Setup](#4-database-setup)
5. [Building & Running](#5-building--running)
6. [Accessing from Other Devices](#6-accessing-from-other-devices)
7. [Running as a Service (Optional)](#7-running-as-a-service-optional)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Software | Version |
|----------|---------|
| Node.js | 18.0.0+ |
| npm | 8.0.0+ |

### Install Node.js

**Windows:**
Download and install from [nodejs.org](https://nodejs.org/) (LTS version recommended)

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify Installation:**
```bash
node --version
npm --version
```

---

## 2. Project Setup

### 2.1 Copy Project Files

Copy the entire `attendance-processor-web` folder to your server/computer.

### 2.2 Install Dependencies

```bash
cd attendance-processor-web
npm install
```

---

## 3. Environment Variables

> **Important:** This project uses TWO environment files:
> - `.env` - For Prisma CLI (database commands)
> - `.env.local` - For Next.js runtime (app secrets)

### 3.1 Create `.env` file (for Prisma)

```bash
# Windows: Create file manually
# Linux/Mac:
echo 'DATABASE_URL="file:./prisma/leave_management.db"' > .env
```

Contents of `.env`:
```bash
DATABASE_URL="file:./prisma/leave_management.db"
```

### 3.2 Create `.env.local` file (for Next.js)

```bash
# Windows: Create file manually or use notepad
# Linux/Mac:
nano .env.local
```

Contents of `.env.local`:
```bash
# Session secret (required) - generate a random string
SESSION_SECRET=<generate-with-openssl-rand-base64-32>

# Admin password for initial users
ADMIN_DEFAULT_PASSWORD=<your-secure-password-here>

# Feature flag
NEXT_PUBLIC_MISSING_TS_HANDLING=true
```

> **Tip:** Generate a random SESSION_SECRET:
> ```bash
> # Linux/Mac
> openssl rand -base64 32
> 
> # Or just use a long random string like:
> # SESSION_SECRET=MySecureLocalNetwork2024SecretKey!!
> ```

---

## 4. Database Setup

### 4.1 Generate Prisma Client

```bash
npx prisma generate
```

### 4.2 Run Migrations

```bash
npx prisma migrate deploy
```

### 4.3 Seed Initial Users

```bash
npx tsx prisma/seed-auth.ts
```

This creates 6 default users:

| Username | Role | Password |
|----------|------|----------|
| admin | ADMIN | (ADMIN_DEFAULT_PASSWORD) |
| thomas | MANAGER | (ADMIN_DEFAULT_PASSWORD) |
| silver | USER | (ADMIN_DEFAULT_PASSWORD) |
| capone | USER | (ADMIN_DEFAULT_PASSWORD) |
| matthew | USER | (ADMIN_DEFAULT_PASSWORD) |
| akared | USER | (ADMIN_DEFAULT_PASSWORD) |

> **Important:** Change passwords after first login!

---

## 5. Building & Running

### 5.1 Build for Production

```bash
npm run build
```

### 5.2 Start the Server

```bash
npm run start -- -H 0.0.0.0 -p 3000
```

The `-H 0.0.0.0` flag allows access from other devices on the network.

### 5.3 Verify It's Running

Open a browser and go to:
- **Local:** http://localhost:3000
- **Network:** http://YOUR_SERVER_IP:3000

---

## 6. Accessing from Other Devices

### 6.1 Find Your Server's IP Address

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your network adapter
```

**Linux:**
```bash
hostname -I
# or
ip addr show
```

### 6.2 Access from Other Computers/Phones

From any device on the same network, open a browser and go to:
```
http://SERVER_IP:3000
```

Example: `http://192.168.1.100:3000`

### 6.3 Windows Firewall (if needed)

If other devices can't connect, allow port 3000 through Windows Firewall:

1. Open **Windows Defender Firewall**
2. Click **Advanced settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → **Next**
5. Select **TCP**, enter **3000** → **Next**
6. Select **Allow the connection** → **Next**
7. Check all profiles → **Next**
8. Name it "Attendance Processor" → **Finish**

### 6.4 Linux Firewall (if needed)

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 3000/tcp

# CentOS/RHEL with firewalld
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

---

## 7. Running as a Service (Optional)

To keep the server running in the background and auto-start on boot.

### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start npm --name "attendance-processor" -- start -- -H 0.0.0.0 -p 3000

# Save the process list
pm2 save

# Setup auto-start on boot
pm2 startup
# Run the command it outputs

# Useful PM2 commands:
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart attendance-processor  # Restart
pm2 stop attendance-processor     # Stop
```

### Option B: Using systemd (Linux only)

Create service file:
```bash
sudo nano /etc/systemd/system/attendance-processor.service
```

Add:
```ini
[Unit]
Description=Attendance Processor Web
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/attendance-processor-web
ExecStart=/usr/bin/npm start -- -H 0.0.0.0 -p 3000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable attendance-processor
sudo systemctl start attendance-processor
sudo systemctl status attendance-processor
```

---

## 8. Troubleshooting

### Server won't start

```bash
# Check if port 3000 is already in use
# Windows:
netstat -ano | findstr :3000

# Linux:
lsof -i :3000

# Kill the process using that port if needed
```

### Can't connect from other devices

1. Check server IP is correct
2. Check firewall allows port 3000
3. Ensure devices are on the same network
4. Try pinging the server: `ping SERVER_IP`

### Database errors

```bash
# Reset database (WARNING: deletes all data)
rm prisma/leave_management.db
npx prisma migrate deploy
npx tsx prisma/seed-auth.ts
```

### Login not working

1. Verify `.env.local` has `SESSION_SECRET` set
2. Restart the server after changing `.env.local`
3. Clear browser cookies and try again

### "Module not found" errors

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
npx prisma generate
npm run build
```

---

## Quick Reference

```bash
# Install
npm install

# Setup database
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed-auth.ts

# Build
npm run build

# Run (accessible on network)
npm run start -- -H 0.0.0.0 -p 3000

# Run with PM2
pm2 start npm --name "attendance-processor" -- start -- -H 0.0.0.0 -p 3000
```

---

## Default Login

After setup, login at `http://SERVER_IP:3000/login`

- **Admin:** username `admin`, password `<ADMIN_DEFAULT_PASSWORD from .env.local>`
- **Manager:** username `thomas`, password `<ADMIN_DEFAULT_PASSWORD from .env.local>`

---

*Last updated: November 2025*
