import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(dotenv_path=_ENV_PATH)

app = FastAPI(title="AI Research Summarizer API")

# Allow all origins for development (HTML files opened directly)
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=("*" not in cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Import routes - sys.path already has backend/ added above
from routes import auth_routes, paper_routes, ai_routes, chat_routes, admin_routes

app.include_router(auth_routes.router)
app.include_router(paper_routes.router)
app.include_router(ai_routes.router)
app.include_router(chat_routes.router)
app.include_router(admin_routes.router)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "API is running"}
