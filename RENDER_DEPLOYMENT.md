# Deploy Backend to Render.com

## Prerequisites

1. **Render.com account** — Sign up at https://render.com
2. **MongoDB Atlas** (cloud database) — Sign up at https://www.mongodb.com/atlas
3. **API Key** already in your `.env` (Mercury)

---

## Step 1: Push code to GitHub

Make sure your code is committed and pushed to your repository:
```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

---

## Step 2: Create MongoDB Atlas (Cloud Database)

1. Go to https://cloud.mongodb.com and log in
2. Create a **free M0 cluster** (any cloud provider / region)
3. Click **"Connect"** → **"Connect your application"**
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
5. In **Network Access**, add `0.0.0.0/0` to allow all IPs (required for Render)
6. In **Database Access**, create a database user with read/write permissions

---

## Step 3: Deploy on Render Dashboard (Easiest)

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your **GitHub repository**
4. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `ai-research-paper-summarizer-backend` |
| **Runtime** | `Python` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` |

5. Add **Environment Variables** (click "Advanced" → "Add Environment Variable"):

| Key | Value |
|---|---|
| `MERCURY_API_KEY` | *(your Mercury API key)* |
| `MONGO_URI` | `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/` |
| `MONGO_DATABASE` | `research_summarizer` |
| `SECRET_KEY` | *(a strong random string, min 32 chars)* |
| `UPLOAD_DIR` | `/tmp/uploads` |
| `PYTHON_VERSION` | `3.11.0` |

6. Click **"Create Web Service"**

7. Wait 2-5 minutes for the build and deploy to complete.

---

## Step 4: Verify Deployment

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

---

## Step 5: Update Frontend

In your frontend's `.env.local`, update the API URL:
```
NEXT_PUBLIC_API_URL=https://ai-research-paper-summarizer-backend.onrender.com
```

---

## Alternative: Deploy using `render.yaml` (Infrastructure as Code)

If you prefer, you can use the included `render.yaml` for Blueprint deployments:

1. Push `render.yaml` to your repo
2. In Render dashboard → **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will read `render.yaml` and auto-create the service
5. You'll still need to manually fill in the **sync: false** environment variables in the Render dashboard

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `Server Error 500` at `/` | Check logs in Render dashboard. Likely MongoDB connection issue. |
| `MongoDB connection refused` | Make sure `MONGO_URI` is the Atlas URI (not `localhost`). Check Network Access in Atlas. |
| `ModuleNotFoundError` | Ensure `requirements.txt` has all packages. Check `rootDir: backend` is set. |
| `Port binding error` | Make sure you use `$PORT` (not `8000`) in the start command. |
| Uploads not working | Files are stored in `/tmp/uploads` which resets on restart. This is normal for free tier. |