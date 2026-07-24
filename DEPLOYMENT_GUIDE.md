# Deployment Guide - Yegara Host (www.gebrehiwet.com)

## Architecture Overview

```
User Browser
    ↓
www.gebrehiwet.com (Frontend - React/Vite - Static Files)
    ↓ API calls
api.gebrehiwet.com (Backend - Node.js/Express)
    ↓
MySQL Database (on Yegara cPanel)
```

**You need 3 things configured:**
1. Frontend (React) → served from `public_html/`
2. Backend (Node.js) → runs as Node.js app on subdomain `api.gebrehiwet.com`
3. MySQL Database → created in cPanel

---

## PHASE 1: MySQL Database Setup (cPanel)

### Step 1: Login to Yegara cPanel
- Go to: `https://gebrehiwet.com/cpanel` or `https://your-yegara-login`
- Enter your cPanel username and password

### Step 2: Create MySQL Database
1. Find **"Databases"** section → click **"MySQL Databases"**
2. Under **"Create New Database"**:
   - Enter database name: `gebrehiwet_forum`
   - Click **"Create Database"**
3. **Write down** the full database name: `yourcpaneluser_gebrehiwet_forum`

### Step 3: Create MySQL User
1. Under **"MySQL Users"** → **"Add New User"**:
   - Username: `forum_admin`
   - Password: `[choose a strong password]`
   - Click **"Create User"**
2. **Write down** the full username: `yourcpaneluser_forum_admin`

### Step 4: Add User to Database
1. Under **"Add User To Database"**:
   - Select user: `yourcpaneluser_forum_admin`
   - Select database: `yourcpaneluser_gebrehiwet_forum`
   - Click **"Add"**
2. Check **"ALL PRIVILEGES"**
3. Click **"Make Changes"**

### Step 5: Import Database Schema
1. Find **"Databases"** → click **"phpMyAdmin"**
2. Click on your database name in the left sidebar
3. Click **"Import"** tab at the top
4. Click **"Choose File"** and select `backend/db/schema.sql`
5. Click **"Go"** to import
6. You should see "Import has been successfully finished"

**Your database credentials (save these):**
```
DB_HOST=localhost
DB_NAME=yourcpaneluser_gebrehiwet_forum
DB_USER=yourcpaneluser_forum_admin
DB_PASS=your_chosen_password
```

---

## PHASE 2: Backend Deployment (Node.js App)

### Step 1: Create Node.js App in cPanel
1. In cPanel, find **"Software"** → click **"Setup Node.js App"**
2. Click **"Create Application"**
3. Fill in:
   - **Node.js version**: Select latest available (18.x or 20.x)
   - **Application mode**: Production
   - **Application root**: `api` (this creates a folder for your backend)
   - **Application URL**: Select `api.gebrehiwet.com` (create this subdomain first if needed)
   - **Application startup file**: `index.js`
4. Click **"Create"**

### Step 2: Create Subdomain (if needed)
1. In cPanel, find **"Domains"** → click **"Create A New Domain"**
2. Enter: `api.gebrehiwet.com`
3. Uncheck "Share document root"
4. Click **"Submit"**

### Step 3: Upload Backend Files
1. In cPanel, open **"File Manager"**
2. Navigate to the `api` folder (or wherever you set the application root)
3. Upload ALL backend files:
   - `index.js`
   - `package.json`
   - `package-lock.json`
   - `db/` folder
   - `src/` folder
   - `.env` file (with production values)

### Step 4: Install Dependencies
1. In cPanel, find **"Terminal"** (or SSH if available)
2. Navigate to your backend folder:
   ```bash
   cd ~/api
   ```
3. Install dependencies:
   ```bash
   npm install --production
   ```

### Step 5: Set Environment Variables
In the Node.js App settings (cPanel → Setup Node.js App → Edit), add these environment variables:

```
PORT=3777
DB_HOST=localhost
DB_NAME=yourcpaneluser_gebrehiwet_forum
DB_USER=yourcpaneluser_forum_admin
DB_PASS=your_chosen_password
JWT_SECRET=your_long_random_secret_string
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_TEXT_MODEL=gemini-2.5-flash
FRONTEND_URL=https://www.gebrehiwet.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=your_email@gmail.com
RAG_UPLOAD_DIR=uploads/rag
RAG_MAX_UPLOAD_MB=5
RAG_CHUNK_CHARS=900
RAG_CHUNK_OVERLAP=120
RAG_MAX_CHUNKS_PER_DOC=1000
RAG_MAX_PDFS_PER_USER=20
RAG_MIN_TEXT_CHARS=50
RAG_SEARCH_THRESHOLD=0.45
RAG_SEARCH_K=10
RECOMMEND_THRESHOLD=0.75
RECOMMEND_K=5
```

### Step 6: Start the Backend
1. In cPanel → Setup Node.js App → click **"Run"** or **"Restart"**
2. Test by visiting: `https://api.gebrehiwet.com/health`
3. You should see: `{"status":"ok","timestamp":"..."}`

---

## PHASE 3: Frontend Deployment (Static Files)

### Step 1: Build Frontend Locally
On your computer, run:
```bash
cd frontend
```

Create production `.env` file:
```
VITE_API_BASE_URL=https://api.gebrehiwet.com
```

Build:
```bash
npm run build
```

This creates a `dist/` folder with optimized files.

### Step 2: Upload to public_html
1. In cPanel **File Manager**, navigate to `public_html/`
2. **DELETE** any default files (like `cgi-bin/`, `default.html`, etc.)
3. Upload ALL contents from the `dist/` folder:
   - `index.html`
   - `assets/` folder
   - `favicon.svg`
   - Any other files from `dist/`

### Step 3: Configure .htaccess for SPA
Create a file named `.htaccess` in `public_html/` with this content:

```apache
RewriteEngine On
RewriteBase /

# Handle API proxy (if needed)
RewriteRule ^api/(.*)$ https://api.gebrehiwet.com/$1 [P,L]

# Handle frontend routing - send all routes to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

---

## PHASE 4: SSL & Domain Configuration

### Step 1: Enable SSL
1. In cPanel, find **"Security"** → **"SSL/TLS"** or **"Let's Encrypt"**
2. Issue SSL certificate for:
   - `www.gebrehiwet.com`
   - `gebrehiwet.com`
   - `api.gebrehiwet.com`
3. Force HTTPS redirect

### Step 2: Test Everything
1. Visit `https://www.gebrehiwet.com` → Should show your React app
2. Visit `https://api.gebrehiwet.com/health` → Should show `{"status":"ok"}`
3. Test login, registration, and other features

---

## PHASE 5: GitHub Push Preparation

Before pushing to GitHub, make sure:

1. **`.gitignore` files are correct** (already fixed)
2. **No secrets in committed files**:
   - `backend/.env` is in `.gitignore` ✓
   - `frontend/.env` is in `.gitignore` ✓
   - `.env.example` files have only placeholders ✓
3. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Evangadi AI Forum"
   git remote add origin https://github.com/yourusername/AI-Integrated-Evangadi-forum-Gebrehiwet.git
   git push -u origin main
   ```

---

## Troubleshooting

### Backend not starting?
- Check cPanel → Node.js App → Error logs
- Make sure all environment variables are set
- Verify `npm install` completed successfully

### Frontend shows blank page?
- Check browser console for errors
- Verify `VITE_API_BASE_URL` points to `https://api.gebrehiwet.com`
- Make sure `.htaccess` file is in `public_html/`

### Database connection error?
- Verify database credentials in backend `.env`
- Make sure user has ALL PRIVILEGES on the database
- Check that database was imported correctly via phpMyAdmin

### CORS errors?
- The backend `index.js` now reads `FRONTEND_URL` from env
- Make sure `FRONTEND_URL=https://www.gebrehiwet.com` is set in backend env vars
