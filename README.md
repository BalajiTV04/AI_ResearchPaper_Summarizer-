# 🧠 AI Research Paper Summarizer

> An intelligent AI-powered platform to upload, summarize, analyze, and interact with academic research papers. Built with FastAPI + Next.js and powered by the Inception Labs Mercury API.

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-009688)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Async-47A248)](https://mongodb.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [User Roles](#-user-roles)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [License](#-license)

---

## 📖 Overview

**AI Research Paper Summarizer** is a full-stack web application that enables researchers, students, and professionals to:

- **Upload** academic PDF research papers
- **Generate** AI-powered summaries at multiple levels of detail
- **Extract** key points, metadata, and image descriptions
- **Chat** interactively with any paper's content
- **Create** customizable quizzes to test comprehension
- **Export** professional PowerPoint presentations

The application uses the **Inception Labs Mercury API** (a powerful LLM) for all AI text generation tasks, MongoDB for data persistence, and features a modern Next.js frontend.

---

## 🚀 Features

### 📄 Paper Management
- **PDF Upload** – Drag-and-drop or browse to upload academic research papers (PDF format)
- **Automatic Text Extraction** – Extracts text from PDFs using PyMuPDF with page count detection
- **Metadata Extraction** – AI-powered extraction of authors, publication date, institution/foundation, journal, and DOI
- **Paper Listing & Search** – View all uploaded papers with sorting by upload date
- **Bookmarking** – Bookmark papers for quick access
- **Delete Papers** – Remove papers and their associated data

### 🤖 AI-Powered Summaries
Three distinct summary types generated for every paper:

| Summary Type | Description |
|-------------|-------------|
| **Short Summary** | 4–6 concise sentences covering problem, methodology, key findings, and significance |
| **Detailed Summary** | 3–5 comprehensive paragraphs with problem/motivation, methodology, results, analysis, and conclusions |
| **ELI5 (Explain Like I'm 5)** | Fun, analogy-rich explanation using simple language for non-technical readers |

### 📊 Key Points Extraction
Structured extraction of key information organized into four categories:
- **Concepts** – Core ideas and themes
- **Methodology** – Approaches, datasets, and experimental setups
- **Results** – Key findings with specific metrics and evidence
- **Conclusions** – Takeaways and future directions

### 🎯 Quiz Generation
- Generate **10 multiple-choice questions** automatically from any paper
- Three difficulty levels: **Easy**, **Medium**, **Hard**
- Each question includes 4 options, correct answer, and explanation
- Quizzes are saved per paper per difficulty level
- View results and scores for all quiz attempts

### 💬 Interactive Chat
- Chat with any paper using an AI research assistant
- The AI answers questions **strictly from the paper content**
- Full chat history is preserved per paper
- Concise, formatted responses with bold terms and bullet points

### 📽️ PowerPoint Export
- Generate **8 slide presentations** from any paper
- Professional **dark-themed** design with accent colors
- Download as `.pptx` file compatible with PowerPoint and Google Slides
- **Regenerate** presentations with enhanced prompts for better results

### 🔍 Content Expansion
Expand any summary format for deeper understanding:
- Expand **Short Summary** – More details on problem, innovation, results
- Expand **Detailed Summary** – 6–8 in-depth paragraphs
- Expand **ELI5** – Story-like explanation with central metaphor
- Expand **Bullet Points** – 15–20 detailed bullet points

### 🖼️ Image & Figure Descriptions
- AI identifies important figures, tables, charts, and diagrams mentioned in the paper
- Returns detailed descriptions of what each visual element shows

### 👑 Admin Dashboard
- **Admin Login** – Secure admin authentication
- **User Management** – View all registered users with their activity
- **Usage Statistics** – Total users, papers, quizzes, PPTs, and chat sessions
- **Per-User Analytics** – Papers uploaded, quiz scores, chat usage, PPT generation

### 🔐 User Authentication
- **Register** with name, email, and password
- **Login** with JWT token-based authentication (24-hour expiry)
- Passwords hashed with **bcrypt** for security
- User-specific data isolation (users only see their own papers)

---

## ⚙️ How It Works

### 1. Upload Flow
```
User uploads PDF → FastAPI validates file type → 
PyMuPDF extracts text & page count → 
Paper metadata stored in MongoDB → Response includes paper_id
```

### 2. Summary Generation Flow
```
User requests summary → System fetches paper text from MongoDB →
AI API called 3× in parallel (short, detailed, ELI5) →
Results stored in summaries collection → Returned to frontend
```

### 3. Chat Flow
```
User sends message → Message saved to chat_history →
Full conversation history retrieved →
AI API called with paper text + history as context →
AI response saved and returned to user
```

### 4. Quiz Generation Flow
```
User requests quiz → Paper text sent to AI with difficulty prompt →
AI returns 10 MCQ questions with options/answers/explanations →
Quiz stored in quizzes collection per paper + difficulty →
Frontend renders interactive quiz interface
```

### 5. PPT Generation Flow
```
User requests PPT → Paper text sent to AI →
AI generates structured slide data (title + bullets) →
python-pptx creates professional dark-themed presentation →
User can download .pptx file or regenerate
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | [Next.js 14](https://nextjs.org) (App Router) + [React 18](https://react.dev) | UI framework & routing |
| **Frontend Styling** | CSS Modules | Component-scoped styling |
| **Backend** | [Python 3.9+](https://python.org) + [FastAPI](https://fastapi.tiangolo.com) | REST API server |
| **Database** | [MongoDB](https://mongodb.com) + [Motor](https://motor.readthedocs.io) (async driver) | Data persistence |
| **AI / LLM** | [Inception Labs Mercury API](https://inceptionlabs.ai) | Text generation, summarization, Q&A |
| **PDF Processing** | [PyMuPDF (fitz)](https://pymupdf.readthedocs.io) | Text extraction from PDFs |
| **Authentication** | [python-jose](https://github.com/mpdavis/python-jose) (JWT) + [bcrypt](https://pypi.org/project/bcrypt/) | Auth & password hashing |
| **PPT Generation** | [python-pptx](https://python-pptx.readthedocs.io) | PowerPoint file creation |
| **HTTP Client** | [requests](https://requests.readthedocs.io) + [OpenAI SDK](https://pypi.org/project/openai/) | API communication |
| **Dev Server** | [Uvicorn](https://www.uvicorn.org) | ASGI server for FastAPI |

---

## 📂 Project Structure

```
AI_ResearchPaper_Summarizer/
├── backend/                          # Python FastAPI backend
│   ├── main.py                       # FastAPI app entry point, CORS, routes
│   ├── auth.py                       # JWT auth, password hashing, token creation
│   ├── database.py                   # MongoDB async connection (Motor)
│   ├── models.py                     # MongoDB collection references
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment variable template
│   ├── run.py                        # Backend startup script
│   ├── routes/                       # API route modules
│   │   ├── auth_routes.py            # Register / Login endpoints
│   │   ├── paper_routes.py           # Upload, list, delete, metadata, bookmark
│   │   ├── ai_routes.py              # Summaries, key points, quiz, PPT, expand
│   │   ├── chat_routes.py            # Interactive paper chat
│   │   └── admin_routes.py           # Admin login, users, dashboard stats
│   └── services/                     # Business logic & AI integration
│       ├── ai_service.py             # Mercury API calls for all AI features
│       ├── mercury_service.py        # Chat-specific Mercury API (OpenAI SDK)
│       ├── pdf_service.py            # PDF text extraction & file saving
│       └── ppt_generator.py          # PowerPoint file generation (python-pptx)
├── frontend/                         # Next.js 14 frontend
│   ├── app/                          # App Router pages
│   │   ├── layout.js                 # Root layout
│   │   ├── page.js                   # Home/dashboard page
│   │   ├── page.module.css           # Home page styles
│   │   ├── login/                    # Login page
│   │   ├── register/                 # Registration page
│   │   ├── dashboard/               # User dashboard
│   │   ├── upload/                   # Paper upload page
│   │   ├── paper/                    # Paper detail & analysis page
│   │   ├── quiz/                     # Quiz generation & taking
│   │   ├── ppt/                      # PPT generation & download
│   │   ├── chat/                     # Chat interface
│   │   └── admin/                    # Admin dashboard
│   ├── components/                   # Reusable React components
│   │   ├── Navbar.js / .module.css   # Navigation bar
│   │   ├── ClientLayout.js           # Client-side layout wrapper
│   │   ├── UploadZone.js / .module.css # Drag-and-drop upload zone
│   │   ├── PaperCard.js / .module.css  # Paper listing card
│   │   ├── ChatBox.js / .module.css    # Chat interface
│   │   ├── FloatingChat.js / .module.css # Floating chat button
│   │   ├── QuizCard.js / .module.css    # Quiz question card
│   │   └── SkeletonLoader.js         # Loading skeleton
│   ├── lib/                          # Utility functions
│   │   └── api.js                    # API client for backend calls
│   └── styles/                       # Global styles
│       └── globals.css               # Global CSS reset & variables
├── scripts/                          # Helper scripts
│   ├── run_backend.bat / .cmd        # Start backend on Windows
│   ├── start_project.cmd             # Start both frontend & backend
│   ├── run_server.py                 # Python server runner
│   ├── setup_and_run.py              # Full setup & run script
│   ├── start_backend.py / start.py   # Backend launchers
│   └── test_servers.bat              # Test server connectivity
├── tests/                            # Test scripts
│   ├── test_api.py                   # API endpoint tests
│   ├── test_backend.py               # Backend functionality tests
│   ├── test_mongodb.py               # MongoDB connection tests
│   ├── test_mongodb_api.py           # MongoDB API integration tests
│   ├── test_mongodb_integration.py   # Full MongoDB integration tests
│   ├── test_mongodb_migration.py     # Database migration tests
│   ├── test_servers.py               # Server health checks
│   ├── test_uvicorn.py               # Uvicorn server tests
│   ├── test_direct.py / test_final.py/ quick_test.py
│   ├── run_and_test.py               # Combined run + test
│   ├── final_check.py                # Final verification
│   ├── verify_install.py             # Installation verification
│   └── install_packages.py           # Dependency installer
├── uploads/                          # Uploaded PDF files directory
├── api/openapi.json                  # OpenAPI schema
├── render.yaml                       # Render deployment config
├── RENDER_DEPLOYMENT.md              # Deployment guide
├── run_backend.cmd                   # Quick backend launcher
├── package-lock.json                 # Root lock file
└── .gitignore                        # Git ignore rules
```

---

## 🔧 Installation & Setup

### Prerequisites

- **Python** 3.9 or later
- **Node.js** 18 or later
- **MongoDB** (local or cloud instance like MongoDB Atlas)
- **Mercury API Key** from [Inception Labs](https://inceptionlabs.ai)

### 1. Clone the Repository

```bash
git clone https://github.com/BalajiTV04/AI_ResearchPaper_Summarizer-.git
cd AI_ResearchPaper_Summarizer-
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Create and activate virtual environment (macOS/Linux)
# python -m venv venv
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

# Edit .env with your API keys and MongoDB URI
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment
copy .env.local.example .env.local   # Windows
# cp .env.local.example .env.local   # macOS/Linux

# Edit .env.local with the backend API URL
```

### 4. Run the Application

**Terminal 1 – Backend:**
```bash
cd backend
venv\Scripts\activate
python run.py
# or: uvicorn main:app --reload --port 8000
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```

The backend runs on `http://localhost:8000` and the frontend on `http://localhost:3000`.

---

## 🔐 Configuration

### Backend Environment Variables (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MERCURY_API_KEY` | ✅ | – | Your Inception Labs Mercury API key |
| `MONGO_URI` | ✅ | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DATABASE` | ❌ | `research_summarizer` | MongoDB database name |
| `SECRET_KEY` | ✅ | `defaultsecret` | JWT signing secret (change in production!) |
| `CORS_ORIGINS` | ❌ | `*` | Allowed CORS origins (comma-separated) |
| `UPLOAD_DIR` | ❌ | `./uploads` | PDF upload directory |
| `ADMIN_USERNAME` | ❌ | `admin` | Admin panel username |
| `ADMIN_PASSWORD` | ❌ | `admin123` | Admin panel password |

### Frontend Environment Variables (`.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:8000` | Backend API base URL |

---

## 📡 API Reference

### Authentication (`/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user (name, email, password) |
| `POST` | `/auth/login` | Login and receive JWT token |

### Papers (`/papers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/papers/upload` | Upload a PDF paper |
| `GET` | `/papers/` | List user's papers |
| `GET` | `/papers/{id}` | Get paper details with extracted text |
| `DELETE` | `/papers/{id}` | Delete a paper |
| `POST` | `/papers/{id}/extract-metadata` | Extract metadata via AI |
| `POST` | `/papers/{id}/bookmark` | Toggle bookmark |

### AI Services (`/ai`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/summarize/{paper_id}` | Generate short, detailed & ELI5 summaries |
| `POST` | `/ai/keypoints/{paper_id}` | Extract structured key points |
| `GET` | `/ai/quiz/{paper_id}` | Get saved quizzes for a paper |
| `POST` | `/ai/quiz/{paper_id}` | Generate mixed-difficulty quiz |
| `GET` | `/ai/quiz/{paper_id}/{difficulty}` | Get quiz by difficulty (easy/medium/hard) |
| `POST` | `/ai/quiz/{paper_id}/{difficulty}` | Generate quiz by difficulty |
| `GET` | `/ai/quiz/{paper_id}/results` | Get all quiz results |
| `GET` | `/ai/ppt/{paper_id}` | Get saved presentation |
| `POST` | `/ai/ppt/{paper_id}` | Generate presentation slides |
| `POST` | `/ai/ppt/{paper_id}/regenerate` | Regenerate with enhanced prompt |
| `POST` | `/ai/ppt/{paper_id}/download` | Download as .pptx file |
| `POST` | `/ai/expand/{paper_id}/{pattern}` | Expand summary (short/detailed/eli5/bullets) |
| `POST` | `/ai/images/{paper_id}` | Describe figures/tables from paper |

### Chat (`/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/chat/{paper_id}` | Get chat history for a paper |
| `POST` | `/chat/{paper_id}` | Send message and get AI response |

### Admin (`/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/login` | Admin login |
| `GET` | `/admin/users` | Get all users with usage details |
| `GET` | `/admin/dashboard` | Get platform-wide statistics |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check (`{"status": "ok"}`) |

---

## 👤 User Roles

### Regular User
- Register and login
- Upload and manage PDF papers
- Generate summaries, key points, metadata
- Take quizzes at multiple difficulty levels
- Chat with papers interactively
- Generate and download PowerPoint presentations
- Bookmark papers

### Admin
- All regular user capabilities
- Admin dashboard with platform-wide statistics
- View all registered users
- Monitor usage: papers uploaded, quizzes taken, PPTs generated, chat sessions

---

## 🚢 Deployment

The project is configured for deployment on **Render**. See [`RENDER_DEPLOYMENT.md`](./RENDER_DEPLOYMENT.md) for detailed instructions.

Key files for deployment:
- `render.yaml` – Render infrastructure-as-code configuration
- `RENDER_DEPLOYMENT.md` – Step-by-step deployment guide

### Quick Deployment Checklist

1. ✅ Set up a MongoDB Atlas cluster (free tier works)
2. ✅ Get a Mercury API key from Inception Labs
3. ✅ Update all environment variables in production
4. ✅ Set a strong `SECRET_KEY` for JWT
5. ✅ Configure CORS origins for your production domain
6. ✅ Set up proper admin credentials

---

## 🧪 Testing

A comprehensive test suite is available in the `tests/` directory:

```bash
# Run all tests
python tests/test_api.py
python tests/test_backend.py
python tests/test_servers.py
python tests/test_mongodb.py

# Verify installation
python tests/verify_install.py

# Run and test in one command
python tests/run_and_test.py

# Final verification
python tests/final_check.py
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Inception Labs](https://inceptionlabs.ai) for the Mercury API powering all AI features
- [FastAPI](https://fastapi.tiangolo.com) for the high-performance backend framework
- [Next.js](https://nextjs.org) for the React framework
- [MongoDB](https://mongodb.com) for the flexible document database
- [PyMuPDF](https://pymupdf.readthedocs.io) for PDF text extraction

---

<p align="center">Made with ❤️ for the research community</p>