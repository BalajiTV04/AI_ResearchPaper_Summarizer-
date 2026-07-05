import logging
import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from auth import get_current_user
from database import get_supabase
import os
from dotenv import load_dotenv
from jose import jwt

logger = logging.getLogger(__name__)

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

router = APIRouter(prefix="/admin", tags=["Admin"])

# Get admin credentials from environment
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

class AdminLoginRequest(BaseModel):
    username: str
    password: str

def verify_admin(username: str, password: str) -> bool:
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD

@router.post("/login")
async def admin_login(req: AdminLoginRequest):
    if not verify_admin(req.username, req.password):
        logger.warning(f"Failed admin login attempt for username: {req.username}")
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Try to sign in with Supabase Auth first
    supabase = get_supabase()
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": f"{ADMIN_USERNAME}@admin.com",
            "password": ADMIN_PASSWORD
        })
        logger.info("Admin logged in successfully via Supabase Auth")
        return {
            "token": auth_response.session.access_token,
            "user": {"name": "Admin", "role": "admin"}
        }
    except Exception as e:
        logger.warning(f"Admin sign-in failed, trying to create admin user: {str(e)}")
        
        # Try to create admin user via admin API
        try:
            supabase.auth.admin.create_user({
                "email": f"{ADMIN_USERNAME}@admin.com",
                "password": ADMIN_PASSWORD,
                "email_confirm": True,
                "user_metadata": {"name": "Admin", "role": "admin"}
            })
            logger.info("Admin user created, signing in...")
            auth_response = supabase.auth.sign_in_with_password({
                "email": f"{ADMIN_USERNAME}@admin.com",
                "password": ADMIN_PASSWORD
            })
            return {
                "token": auth_response.session.access_token,
                "user": {"name": "Admin", "role": "admin"}
            }
        except Exception as inner_e:
            logger.warning(f"Admin API create_user failed: {str(inner_e)}")
            # Fallback: generate a self-signed JWT using the service_role key
            # This allows admin access without needing a Supabase Auth user
            logger.info("Falling back to self-signed JWT for admin access")
            try:
                # Extract the JWT secret from the service_role key (it's the second part)
                # The service_role key is a JWT itself, we use it to sign a new token
                payload = {
                    "sub": "admin",
                    "role": "admin",
                    "email": f"{ADMIN_USERNAME}@admin.com",
                    "user_metadata": {"name": "Admin", "role": "admin"},
                    "app_metadata": {"role": "admin"},
                    "iat": int(time.time()),
                    "exp": int(time.time()) + 3600,  # 1 hour expiry
                    "aud": "authenticated"
                }
                # Use the service_role key as the signing secret
                admin_token = jwt.encode(payload, SUPABASE_SERVICE_KEY, algorithm="HS256")
                logger.info("Admin self-signed JWT created successfully")
                return {
                    "token": admin_token,
                    "user": {"name": "Admin", "role": "admin"}
                }
            except Exception as jwt_err:
                logger.error(f"Failed to create self-signed JWT: {str(jwt_err)}")
                raise HTTPException(status_code=500, detail=f"Admin auth setup failed: {str(inner_e)}")

@router.get("/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    """Get all users with their paper details, quiz scores, AI chat usage, and PPT usage"""
    supabase = get_supabase()
    
    # Get all profiles
    profiles_result = supabase.table("profiles").select("*").execute()
    profiles = profiles_result.data if profiles_result.data else []
    
    # Get all papers
    papers_result = supabase.table("papers").select("*").execute()
    all_papers = papers_result.data if papers_result.data else []
    
    # Get all quizzes
    quizzes_result = supabase.table("quizzes").select("*").execute()
    all_quizzes = quizzes_result.data if quizzes_result.data else []
    
    # Get chat sessions
    chat_result = supabase.table("chat_history").select("user_id").execute()
    chat_users = set(row.get("user_id") for row in (chat_result.data or []))
    
    # Get all PPTs
    ppt_result = supabase.table("ppt_content").select("paper_id").execute()
    ppt_paper_ids = set(row.get("paper_id") for row in (ppt_result.data or []))
    
    users = []
    for profile in profiles:
        user_id = profile["id"]
        
        # Get papers for this user
        user_papers = [p for p in all_papers if p.get("user_id") == user_id]
        paper_count = len(user_papers)
        
        papers = [{
            "id": p["id"],
            "title": p.get("title", "Untitled"),
            "uploaded_at": str(p.get("uploaded_at", "")),
            "page_count": p.get("page_count", 0)
        } for p in user_papers]
        
        # Get quiz scores for this user
        quiz_data = {}
        for quiz in all_quizzes:
            if quiz.get("paper_id"):
                # Check if quiz belongs to one of the user's papers
                if any(p["id"] == quiz["paper_id"] for p in papers):
                    difficulty = quiz.get("difficulty", "mixed")
                    questions = quiz.get("questions", [])
                    if difficulty not in quiz_data:
                        quiz_data[difficulty] = {"total": len(questions)}
                    else:
                        quiz_data[difficulty]["total"] = quiz_data[difficulty].get("total", 0) + len(questions)
        
        # Check usage
        chat_used = user_id in chat_users
        ppt_used = any(pid in ppt_paper_ids for pid in [p["id"] for p in papers])
        quiz_used = len(quiz_data) > 0
        
        users.append({
            "id": user_id,
            "name": profile.get("name", "Unknown"),
            "email": profile.get("email", "Unknown"),
            "registered_at": str(profile.get("created_at", "N/A")),
            "total_papers": paper_count,
            "papers": papers,
            "quiz_scores": quiz_data,
            "quiz_used": quiz_used,
            "chat_used": chat_used,
            "ppt_used": ppt_used
        })
    
    return {"users": users, "total_users": len(users)}

@router.get("/dashboard")
async def admin_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get admin dashboard statistics"""
    supabase = get_supabase()
    
    # Count users
    profiles_result = supabase.table("profiles").select("id", count="exact").execute()
    total_users = profiles_result.count if hasattr(profiles_result, 'count') else len(profiles_result.data or [])
    
    # Count papers
    papers_result = supabase.table("papers").select("id", count="exact").execute()
    total_papers = papers_result.count if hasattr(papers_result, 'count') else len(papers_result.data or [])
    
    # Count quizzes
    quizzes_result = supabase.table("quizzes").select("id", count="exact").execute()
    total_quizzes = quizzes_result.count if hasattr(quizzes_result, 'count') else len(quizzes_result.data or [])
    
    # Count PPTs
    ppt_result = supabase.table("ppt_content").select("id", count="exact").execute()
    total_ppts = ppt_result.count if hasattr(ppt_result, 'count') else len(ppt_result.data or [])
    
    # Count chat messages
    chat_result = supabase.table("chat_history").select("id", count="exact").execute()
    chat_sessions = chat_result.count if hasattr(chat_result, 'count') else len(chat_result.data or [])
    
    # Users who used quizzes
    quizzes = supabase.table("quizzes").select("paper_id").execute()
    quiz_paper_ids = set(row.get("paper_id") for row in (quizzes.data or []))
    users_with_quizzes = 0
    if quiz_paper_ids:
        papers_with_quiz = supabase.table("papers").select("user_id").in_("id", list(quiz_paper_ids)).execute()
        users_with_quizzes = len(set(p.get("user_id") for p in (papers_with_quiz.data or [])))
    
    return {
        "total_users": total_users,
        "total_papers": total_papers,
        "total_quizzes": total_quizzes,
        "total_ppts": total_ppts,
        "chat_sessions": chat_sessions,
        "users_with_quizzes": users_with_quizzes
    }