from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from database import get_supabase
from services.mercury_service import chat_with_paper

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/{paper_id}")
async def get_chat_history(paper_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("chat_history")\
        .select("role, content")\
        .eq("paper_id", paper_id)\
        .order("created_at")\
        .execute()
    
    history = result.data if result.data else []
    return history

@router.post("/{paper_id}")
async def chat(paper_id: str, req: dict, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    
    # Verify paper ownership
    paper_result = supabase.table("papers").select("*").eq("id", paper_id).single().execute()
    paper = paper_result.data
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    # Save user message
    supabase.table("chat_history").insert({
        "paper_id": paper_id,
        "user_id": current_user["id"],
        "role": "user",
        "content": req["message"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()

    # Get full history
    history_result = supabase.table("chat_history")\
        .select("role, content")\
        .eq("paper_id", paper_id)\
        .order("created_at")\
        .execute()
    
    history_rows = history_result.data if history_result.data else []

    # AI response
    response = await chat_with_paper(paper["extracted_text"], history_rows, req["message"])

    # Save AI response
    supabase.table("chat_history").insert({
        "paper_id": paper_id,
        "user_id": current_user["id"],
        "role": "assistant",
        "content": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()

    return {"response": response}