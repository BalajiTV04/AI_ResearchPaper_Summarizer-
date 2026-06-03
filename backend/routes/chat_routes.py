from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from models import papers_collection, chat_collection
from database import str_to_id
from services.mercury_service import chat_with_paper

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/{paper_id}")
async def get_chat_history(paper_id: str, current_user: dict = Depends(get_current_user)):
    cursor = chat_collection.find({"paper_id": paper_id})
    history = []
    async for row in cursor.sort("created_at", 1):
        history.append({
            "role": row["role"],
            "content": row["content"]
        })
    return history

@router.post("/{paper_id}")
async def chat(paper_id: str, req: dict, current_user: dict = Depends(get_current_user)):
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    # Save user message
    await chat_collection.insert_one({
        "paper_id": paper_id,
        "user_id": current_user["id"],
        "role": "user",
        "content": req["message"],
        "created_at": datetime.utcnow()
    })

    # Get full history
    cursor = chat_collection.find({"paper_id": paper_id})
    history_rows = []
    async for row in cursor.sort("created_at", 1):
        history_rows.append({"role": row["role"], "content": row["content"]})

    # AI response
    response = await chat_with_paper(paper["extracted_text"], history_rows, req["message"])

    # Save AI response
    await chat_collection.insert_one({
        "paper_id": paper_id,
        "user_id": current_user["id"],
        "role": "assistant",
        "content": response,
        "created_at": datetime.utcnow()
    })

    return {"response": response}