# AI Research Paper Summarizer

Upload research papers and get AI-powered summaries, quizzes, chat, and presentations.

---

## 🔐 Admin Panel

**Admin Login URL:** `/admin/login`

**Default Credentials:**
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

**To change admin credentials**, edit `backend/.env`:
```
ADMIN_USERNAME=your_new_username
ADMIN_PASSWORD=your_new_password
```

The admin panel provides:
- 📊 Dashboard with platform statistics (users, papers, quizzes, PPTs, chat sessions)
- 👥 User management with search and filtering
- 📄 View each user's uploaded papers, quiz scores, and feature usage

---

## 📱 Responsive Design

The UI is fully responsive for **Mobile**, **Tablet**, and **Laptop/Desktop** devices.

### Breakpoints

| Device | Screen Width | Key Features |
|--------|-------------|--------------|
| 📱 Small Phone | < 480px | Single column layouts, stacked navigation |
| 📱 Mobile | < 640px | Compact cards, full-width inputs |
| 📱 Tablet | 641px - 1024px | 2-3 column grids, adjusted spacing |
| 💻 Laptop | 641px - 1024px | 3-4 column grids, full layout |
| 🖥️ Desktop | > 1025px | Max-width containers, full feature grids |

### Responsive Features

- **Hamburger Menu**: Navigation collapses into a slide-out menu on mobile/tablet
- **Fluid Typography**: Uses `clamp()` for font sizes that scale smoothly
- **Flexible Grids**: CSS Grid with `auto-fit`/`auto-fill` adapts columns automatically
- **Touch-Friendly**: Larger tap targets on mobile, always-visible delete buttons
- **Optimized Padding**: Container padding adjusts per viewport

### Files Modified for Responsiveness

| File | Changes |
|------|---------|
| `frontend/styles/globals.css` | Added responsive CSS variables, utility classes, scrollbar styling |
| `frontend/components/Navbar.js` | Added hamburger menu toggle for mobile |
| `frontend/components/Navbar.module.css` | Responsive nav with slide-out menu |
| `frontend/app/page.module.css` | Fluid hero section, responsive feature grid |
| `frontend/app/dashboard/page.module.css` | Responsive paper grid, mobile delete buttons |
| `frontend/app/upload/page.js` | Fluid typography and spacing |
| `frontend/components/UploadZone.module.css` | Responsive drop zone and buttons |
| `frontend/app/login/auth.module.css` | Responsive auth cards |
| `frontend/app/register/auth.module.css` | Responsive auth cards |
| `frontend/app/admin/login/admin.module.css` | Responsive admin login |
| `frontend/app/admin/dashboard/dashboard.module.css` | Responsive stats grid and user cards |
| `frontend/app/paper/[id]/page.module.css` | Comprehensive responsive patterns |

---

## 🗄️ Supabase Database Setup Guide

This project uses **Supabase** for both database and authentication.

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up or log in
2. Click **"New Project"**
3. Fill in:
   - **Name:** `AI-Research-Paper-Summarizer` (or any name)
   - **Database Password:** Create a strong password (save this somewhere safe)
   - **Region:** Choose the region closest to your users
4. Wait **2-3 minutes** for the project to be provisioned

### Step 2: Run the Migration SQL

1. In your Supabase Dashboard, go to **SQL Editor** in the left sidebar
2. Click **"New Query"** (or **"+ New Query"**)
3. Open the file **`database/supabase_migration.sql`** from this project
4. Copy the entire contents and paste into the SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
6. Verify success — you should see green checkmarks

This creates the following tables:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (auto-created on signup) |
| `papers` | Uploaded research papers |
| `summaries` | AI-generated summaries |
| `quizzes` | Generated quiz questions |
| `ppt_content` | Presentation slides |
| `chat_history` | AI chat messages |
| `bookmarks` | User bookmarked papers |

### Step 3: Get Your API Keys

1. In Supabase Dashboard, go to **Project Settings** → **API**
2. You'll find these values:

   ```
   Project URL: https://xxxxxxxxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (keep secret!)
   ```

### Step 4: Configure Backend

Create or edit **`backend/.env`**:

```env
# ─── Supabase (Database + Auth) ───
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# ─── AI API Keys ───
MERCURY_API_KEY=your_mercury_api_key_here

# ─── Admin Credentials ───
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# ─── CORS ───
CORS_ORIGINS=http://localhost:3000

# ─── File Uploads ───
UPLOAD_DIR=./uploads
```

### Step 5: Configure Frontend

Create or edit **`frontend/.env.local`**:

```env
# Backend API URL (for local development)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase (for client-side auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co/rest/v1/
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ **Important:** The `NEXT_PUBLIC_SUPABASE_URL` must end with `/rest/v1/`

### Step 6: Configure Auth Settings

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** is enabled (it's enabled by default)
3. Go to **Authentication** → **Settings**
4. Under **"Email Auth"**:
   - **Confirm email:** Disable this (or keep enabled — your backend handles auto-confirmation via `service_role` key)
5. **Site URL:** Set to `http://localhost:3000` (for local dev)
6. **Redirect URLs:** Add `http://localhost:3000/**`

### Step 7: Verify Row Level Security (RLS)

The migration SQL includes RLS policies. To verify:
1. Go to **Authentication** → **Policies**
2. You should see policies for all tables:
   - `profiles` — Users can read/update their own profile
   - `papers` — Users can CRUD their own papers
   - `summaries`, `quizzes`, `ppt_content`, `chat_history` — Access via paper ownership
   - `bookmarks` — Users can CRUD their own bookmarks

### Step 8: Test the Setup

1. Start the backend: `cd backend && uvicorn main:app --reload`
2. Start the frontend: `cd frontend && npm run dev`
3. Go to `http://localhost:3000/register` and create an account
4. Check Supabase Dashboard → **Authentication** → **Users** — you should see the new user
5. Check **Table Editor** → `profiles` — the user's profile should be auto-created

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- Supabase project (see setup above)
- Mercury API key (for AI features)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Edit .env with your keys
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
# Edit .env.local with your keys
npm run dev
```

### Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Admin Panel:** http://localhost:3000/admin/login

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), CSS Modules
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth (JWT)
- **AI:** Mercury API (summaries, quizzes, chat, PPT)
- **File Processing:** PyMuPDF (PDF text extraction)