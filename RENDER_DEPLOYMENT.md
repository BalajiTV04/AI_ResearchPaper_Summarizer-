# 🚀 Deployment Guide: Vercel (Frontend) + Render (Backend)

## Prerequisites

1. **GitHub account** — Your code is already at https://github.com/BalajiTV04/AI_ResearchPaper_Summarizer-
2. **Render.com account** — Sign up at https://render.com
3. **Vercel account** — Sign up at https://vercel.com (use GitHub login)
4. **MongoDB Atlas** (cloud database) — Sign up at https://www.mongodb.com/atlas
5. **Mercury API Key** from [Inception Labs](https://inceptionlabs.ai)

---

## Step 1: Push Code to GitHub

Make sure all changes are committed and pushed:

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
6. Copy the connection string — it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
7. **Network Access**: Add `0.0.0.0/0` to allow all IPs (required for Render)
8. **Database Access**: Create a database user with read/write permissions

---

## Step 3: Deploy Backend on Render

### Option A: Using Render Dashboard (Recommended)

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitHub repository** (`BalajiTV04/AI_ResearchPaper_Summarizer-`)
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `ai-research-paper-summarizer-backend` |
| **Runtime** | `Python` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` |

5. Click **"Advanced"** → **"Add Environment Variable"** and add these:

| Key | Value | Notes |
|-----|-------|-------|
| `MERCURY_API_KEY` | *(your Mercury API key)* | Required for AI features |
| `MONGO_URI` | `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/` | From MongoDB Atlas |
| `MONGO_DATABASE` | `research_summarizer` | Database name |
| `SECRET_KEY` | *(random 32+ char string)* | For JWT tokens |
| `CORS_ORIGINS` | `https://ai-based-research-summarizer.vercel.app` | Your Vercel frontend URL |
| `UPLOAD_DIR` | `/tmp/uploads` | Ephemeral storage (free tier) |
| `PYTHON_VERSION` | `3.11.0` | Python version |
| `PYTHONPATH` | `/opt/render/project/src/backend` | Ensures imports work |
| `ADMIN_USERNAME` | *(choose a username)* | Admin panel login |
| `ADMIN_PASSWORD` | *(choose a strong password)* | Admin panel login |

6. Click **"Create Web Service"**
7. Wait 2-5 minutes for the build and deploy to complete.

### Option B: Using Blueprint (render.yaml)

1. In Render dashboard → **"New +"** → **"Blueprint"**
2. Connect your repository
3. Render will read `render.yaml` and auto-create the service
4. You'll still need to manually fill in the **sync: false** environment variables:
   - `MERCURY_API_KEY`
   - `MONGO_URI`
   - `SECRET_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`

---

## Step 4: Verify Backend Deployment

Once deployed, your API will be available at:
```
https://ai-research-paper-summarizer-backend.onrender.com
```

### Quick Test

```bash
# Health check
curl https://ai-research-paper-summarizer-backend.onrender.com/

# API Docs
https://ai-research-paper-summarizer-backend.onrender.com/docs
```

Expected response:
```json
{"status": "ok", "message": "API is running"}
```

---

## Step 5: Deploy Frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your **GitHub repository** (`BalajiTV04/AI_ResearchPaper_Summarizer-`)
4. Configure the project:

| Setting | Value |
|---------|-------|
| **Project Name** | `AI-Based-research-summarizer` |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `.next` (auto-detected) |

5. Click **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://ai-research-paper-summarizer-backend.onrender.com` |

6. Click **"Deploy"**
7. Wait 1-2 minutes for the build and deploy to complete.

Your frontend will be available at:
```
https://ai-based-research-summarizer.vercel.app
```

---

## Step 6: Final Configuration

### Update CORS (if needed)

If your Vercel URL is different from the default, update the `CORS_ORIGINS` environment variable in Render:

```
CORS_ORIGINS=https://your-custom-domain.vercel.app
```

### Update Frontend API URL (if needed)

If your Render URL is different, update the `NEXT_PUBLIC_API_URL` in Vercel and redeploy.

---

## Step 7: Verify Full Integration

1. Open your Vercel frontend URL
2. Register a new account
3. Upload a PDF paper
4. Generate summaries, quizzes, and PPT
5. Test the AI chat feature
6. Check the admin dashboard

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **`Server Error 500` at `/`** | Check logs in Render dashboard. Likely MongoDB connection issue. |
| **`MongoDB connection refused`** | Make sure `MONGO_URI` is the Atlas URI (not `localhost`). Check Network Access in Atlas. |
| **`ModuleNotFoundError`** | Ensure `requirements.txt` has all packages. Check `rootDir: backend` is set. |
| **`Port binding error`** | Make sure you use `$PORT` (not `8000`) in the start command. |
| **Uploads not working** | Files are stored in `/tmp/uploads` which resets on restart. This is normal for free tier. |
| **CORS errors in browser** | Verify `CORS_ORIGINS` in Render matches your Vercel URL exactly. |
| **Frontend can't reach backend** | Check `NEXT_PUBLIC_API_URL` in Vercel env vars. Must include `https://` and no trailing slash. |
| **AI features not working** | Verify `MERCURY_API_KEY` is set correctly in Render env vars. |
| **PPT download fails** | Make sure the backend URL is correct in the frontend env vars. |
| **Login/Register fails** | Check MongoDB connection. Verify `SECRET_KEY` is set. |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                     │
│              https://ai-based-research-                  │
│              summarizer.vercel.app                       │
│                                                         │
│  Next.js 14 App Router                                  │
│  - Login / Register                                     │
│  - Upload & View Papers                                 │
│  - AI Summaries, Quiz, PPT, Chat                        │
│  - Admin Dashboard                                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / API Calls
                       │ NEXT_PUBLIC_API_URL
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Render (Backend)                      │
│              https://ai-research-paper-                  │
│              summarizer-backend.onrender.com             │
│                                                         │
│  FastAPI + Uvicorn                                      │
│  - REST API endpoints                                   │
│  - JWT Authentication                                   │
│  - AI Integration (Mercury API)                         │
│  - PDF Processing (PyMuPDF)                             │
│  - PPT Generation (python-pptx)                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              MongoDB Atlas (Database)                    │
│              mongodb+srv://...@cluster0.xxxxx.mongodb.net│
│                                                         │
│  Collections:                                           │
│  - users, papers, summaries                             │
│  - quizzes, ppt_content, chat_history                   │
│  - bookmarks                                            │
└─────────────────────────────────────────────────────────┘
```

---

## Cost Breakdown (Free Tier)

| Service | Cost | Limits |
|---------|------|--------|
| **Vercel** | Free | 100 GB bandwidth, 6000 build minutes/month |
| **Render** | Free | 750 hours/month, 512 MB RAM, spins down after 15 min idle |
| **MongoDB Atlas** | Free | 512 MB storage, shared RAM |
| **Mercury API** | Paid | Check Inception Labs pricing |

> **Note:** Render's free tier spins down after 15 minutes of inactivity. The first request after idle will take 30-60 seconds to wake up. Consider upgrading to a paid plan ($7/month) for instant responses.

---

## Updating After Deployment

### To update the backend:
1. Push changes to GitHub
2. Render auto-deploys (if `autoDeploy: true`)

### To update the frontend:
1. Push changes to GitHub
2. Vercel auto-deploys from the main branch

### To trigger a manual redeploy:
- **Render**: Dashboard → Service → "Manual Deploy" → "Deploy latest commit"
- **Vercel**: Dashboard → Project → "Deployments" → "Redeploy"