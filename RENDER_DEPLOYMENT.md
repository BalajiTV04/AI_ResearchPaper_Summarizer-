# 🚀 Deployment Guide: Vercel (Frontend) + Render (Backend)

## 🌐 Live URLs (Your Actual Deployments)

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | `https://ai-based-research-paper-summarizer.vercel.app` |
| **Backend (Render)** | `https://ai-researchpaper-summarizer.onrender.com` |
| **API Docs** | `https://ai-researchpaper-summarizer.onrender.com/docs` |

---

## ⚠️ Fix for Render Error: "Could not open requirements file"

If you see this error in Render:
```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

**Fix:** Go to your Render Dashboard → Service `ai-researchpaper-summarizer` → **Settings** → **Build & Deploy** → **Root Directory** → Change to **`backend`** → Save → The service will auto-redeploy.

---

## Prerequisites

1. **GitHub account** — Your code is at https://github.com/BalajiTV04/AI_ResearchPaper_Summarizer-
2. **Render.com account** — Sign up at https://render.com
3. **Vercel account** — Sign up at https://vercel.com
4. **MongoDB Atlas** — Sign up at https://www.mongodb.com/atlas
5. **Mercury API Key** from [Inception Labs](https://inceptionlabs.ai)

---

## Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Configure for Vercel + Render deployment"
git push origin main
```

---

## Step 2: Create MongoDB Atlas (Cloud Database)

1. Go to https://cloud.mongodb.com and log in
2. Click **"Create"** → **"Cluster"** → Choose **M0 Free Tier**
3. Select any cloud provider and region (e.g., AWS, us-east-1)
4. Click **"Create Cluster"** (takes 1-3 minutes)
5. Once created, click **"Connect"** → **"Connect your application"**
6. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
7. **Network Access**: Add `0.0.0.0/0` to allow all IPs (required for Render)
8. **Database Access**: Create a database user with read/write permissions

---

## Step 3: Deploy Backend on Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitHub repository** (`BalajiTV04/AI_ResearchPaper_Summarizer-`)
4. ⚠️ **IMPORTANT** — Configure these settings EXACTLY:

| Setting | Value |
|---------|-------|
| **Name** | `ai-researchpaper-summarizer` |
| **Runtime** | `Python` |
| **Branch** | `main` |
| **Root Directory** | `backend` ← **THIS IS CRITICAL** |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` |

5. Click **"Advanced"** → **"Add Environment Variable"** and add these:

| Key | Value |
|-----|-------|
| `MERCURY_API_KEY` | *(your Mercury API key)* |
| `MONGO_URI` | `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/` |
| `MONGO_DATABASE` | `research_summarizer` |
| `SECRET_KEY` | *(random 32+ char string)* |
| `CORS_ORIGINS` | `https://ai-based-research-paper-summarizer.vercel.app` |
| `UPLOAD_DIR` | `/tmp/uploads` |
| `PYTHON_VERSION` | `3.11.0` |
| `PYTHONPATH` | `/opt/render/project/src/backend` |
| `ADMIN_USERNAME` | *(choose a username)* |
| `ADMIN_PASSWORD` | *(choose a strong password)* |

6. Click **"Create Web Service"**
7. Wait 2-5 minutes for the build and deploy to complete.

---

## Step 4: Verify Backend is Running

```bash
curl https://ai-researchpaper-summarizer.onrender.com/
```

Expected response:
```json
{"status": "ok", "message": "API is running"}
```

Also check the API docs:
```
https://ai-researchpaper-summarizer.onrender.com/docs
```

---

## Step 5: Deploy Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your **GitHub repository** (`BalajiTV04/AI_ResearchPaper_Summarizer-`)
4. Configure the project:

| Setting | Value |
|---------|-------|
| **Project Name** | `AI-based-research-paper-summarizer` |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |

5. Click **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://ai-researchpaper-summarizer.onrender.com` |

6. Click **"Deploy"**
7. Wait 1-2 minutes.

Your frontend will be at:
```
https://ai-based-research-paper-summarizer.vercel.app
```

---

## Step 6: Connect Frontend ↔ Backend

### In Vercel Dashboard (already done above):
- `NEXT_PUBLIC_API_URL` = `https://ai-researchpaper-summarizer.onrender.com`

### In Render Dashboard (already done above):
- `CORS_ORIGINS` = `https://ai-based-research-paper-summarizer.vercel.app`

### After any changes, redeploy:

**Render:** Dashboard → Service → "Manual Deploy" → "Deploy latest commit"
**Vercel:** Dashboard → Project → "Deployments" → "Redeploy"

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **`Could not open requirements.txt`** | Set **Root Directory** to `backend` in Render Settings |
| **`Server Error 500`** | Check logs in Render dashboard. Likely MongoDB connection issue. |
| **`MongoDB connection refused`** | Make sure `MONGO_URI` is the Atlas URI (not `localhost`). Check Network Access in Atlas. |
| **`ModuleNotFoundError`** | Ensure `requirements.txt` has all packages. Check `rootDir: backend` is set. |
| **CORS errors in browser** | Verify `CORS_ORIGINS` in Render matches your Vercel URL exactly. |
| **Frontend can't reach backend** | Check `NEXT_PUBLIC_API_URL` in Vercel env vars. Must include `https://` and no trailing slash. |
| **AI features not working** | Verify `MERCURY_API_KEY` is set correctly in Render env vars. |
| **Login/Register fails** | Check MongoDB connection. Verify `SECRET_KEY` is set. |

---

## Architecture

```
https://ai-based-research-paper-summarizer.vercel.app  (Vercel - Next.js Frontend)
        │
        │  HTTPS API calls to NEXT_PUBLIC_API_URL
        ▼
https://ai-researchpaper-summarizer.onrender.com         (Render - FastAPI Backend)
        │
        │  MongoDB Atlas connection
        ▼
mongodb+srv://...@cluster0.xxxxx.mongodb.net/          (MongoDB Atlas Database)