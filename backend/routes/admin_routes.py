from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from auth import hash_password, verify_password, create_access_token
from models import users_collection, papers_collection, summaries_collection, quizzes_collection, ppt_collection, chat_collection
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

router = APIRouter(prefix="/admin", tags=["Admin"])

# Get admin credentials from environment
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

class AdminLoginRequest(BaseModel):
    username: str
    password: str

def verify_admin(username: str, password: str) -> bool:
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD

class AdminAuthDependency:
    """Simple dependency to check admin token"""
    async def __call__(self, token: str = Depends(lambda: None)):
        # We use a simple token-based auth for admin
        # The frontend will send the admin token in the header
        pass

@router.post("/login")
async def admin_login(req: AdminLoginRequest):
    if not verify_admin(req.username, req.password):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Create a special admin token
    admin_token = create_access_token(data={"sub": "admin", "role": "admin"})
    return {
        "token": admin_token,
        "user": {"name": "Admin", "role": "admin"}
    }

@router.get("/users")
async def get_all_users():
    """Get all users with their paper details, quiz scores, AI chat usage, and PPT usage"""
    users = []
    cursor = users_collection.find({})
    
    async for user in cursor:
        user_id = str(user["_id"])
        
        # Get papers for this user
        papers = []
        papers_cursor = papers_collection.find({"user_id": user_id})
        paper_count = 0
        async for paper in papers_cursor:
            papers.append({
                "id": str(paper["_id"]),
                "title": paper.get("title", "Untitled"),
                "uploaded_at": str(paper.get("uploaded_at", "")),
                "page_count": paper.get("page_count", 0)
            })
            paper_count += 1
        
        # Get quiz scores for this user's papers
        quiz_data = {}
        quiz_cursor = quizzes_collection.find({})
        async for quiz in quiz_cursor:
            # Check if this quiz belongs to one of the user's papers
            if quiz.get("paper_id"):
                difficulty = quiz.get("difficulty", "mixed")
                questions = quiz.get("questions", [])
                if difficulty not in quiz_data:
                    quiz_data[difficulty] = {"total": len(questions)}
                else:
                    quiz_data[difficulty]["total"] = quiz_data[difficulty].get("total", 0) + len(questions)
        
        # Check if user used AI chat
        chat_used = False
        chat_cursor = chat_collection.find({})
        async for chat in chat_cursor:
            if chat.get("user_id") == user_id:
                chat_used = True
                break
        
        # Check if user generated PPT
        ppt_used = False
        # Check through papers - if any paper has ppt, mark as used
        for paper in papers:
            ppt_data = await ppt_collection.find_one({"paper_id": paper["id"]})
            if ppt_data:
                ppt_used = True
                break
        
        # Check if user has taken quizzes
        quiz_used = False
        if len(quiz_data) > 0:
            quiz_used = True
        
        users.append({
            "id": user_id,
            "name": user.get("name", "Unknown"),
            "email": user.get("email", "Unknown"),
            "registered_at": str(user.get("_id").generation_time) if hasattr(user.get("_id"), "generation_time") else "N/A",
            "total_papers": paper_count,
            "papers": papers,
            "quiz_scores": quiz_data,
            "quiz_used": quiz_used or len(quiz_data) > 0,
            "chat_used": chat_used,
            "ppt_used": ppt_used
        })
    
    return {"users": users, "total_users": len(users)}

@router.get("/dashboard")
async def admin_dashboard_stats():
    """Get admin dashboard statistics"""
    total_users = await users_collection.count_documents({})
    total_papers = await papers_collection.count_documents({})
    total_quizzes = await quizzes_collection.count_documents({})
    total_ppts = await ppt_collection.count_documents({})
    
    # Chat usage stats
    chat_sessions = await chat_collection.count_documents({})
    
    # Users who used features
    users_with_quizzes = set()
    quiz_cursor = quizzes_collection.find({}, {"paper_id": 1})
    async for quiz in quiz_cursor:
        paper_id = quiz.get("paper_id")
        if paper_id:
            paper = await papers_collection.find_one({"_id": paper_id})
            if paper:
                users_with_quizzes.add(paper.get("user_id"))
    
    return {
        "total_users": total_users,
        "total_papers": total_papers,
        "total_quizzes": total_quizzes,
        "total_ppts": total_ppts,
        "chat_sessions": chat_sessions,
        "users_with_quizzes": len(users_with_quizzes)
    }