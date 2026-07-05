import os
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from auth import get_current_user
from database import get_supabase
from services.pdf_service import extract_text_from_pdf, save_uploaded_file, extract_images_from_pdf
from services.ai_service import extract_paper_metadata

router = APIRouter(prefix="/papers", tags=["Papers"])

@router.post("/upload")
async def upload_paper(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    file_path = save_uploaded_file(upload_dir, file)

    try:
        text, page_count = extract_text_from_pdf(file_path)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))

    title = os.path.splitext(file.filename)[0]
    filename = file.filename

    supabase = get_supabase()
    paper_doc = {
        "user_id": current_user["id"],
        "title": title,
        "filename": filename,
        "file_path": file_path,
        "extracted_text": text,
        "page_count": page_count,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = supabase.table("papers").insert(paper_doc).execute()
    new_paper = result.data[0]

    return {"paper_id": new_paper["id"], "title": title, "page_count": page_count}

@router.get("/")
async def get_papers(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("papers")\
        .select("id, title, filename, page_count, uploaded_at")\
        .eq("user_id", current_user["id"])\
        .order("uploaded_at", desc=True)\
        .execute()
    
    papers = result.data if result.data else []
    return papers

@router.get("/{paper_id}")
async def get_paper(paper_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("papers").select("*").eq("id", paper_id).single().execute()
    
    paper = result.data
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return paper

@router.delete("/{paper_id}")
async def delete_paper(paper_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    
    # Get paper first
    result = supabase.table("papers").select("*").eq("id", paper_id).single().execute()
    paper = result.data
    
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    if os.path.exists(paper.get("file_path", "")):
        os.remove(paper["file_path"])

    # Delete related data
    supabase.table("papers").delete().eq("id", paper_id).execute()
    supabase.table("summaries").delete().eq("paper_id", paper_id).execute()
    supabase.table("quizzes").delete().eq("paper_id", paper_id).execute()
    supabase.table("ppt_content").delete().eq("paper_id", paper_id).execute()
    supabase.table("chat_history").delete().eq("paper_id", paper_id).execute()
    supabase.table("bookmarks").delete().eq("paper_id", paper_id).execute()
    
    return {"message": "Paper deleted successfully"}

@router.post("/{paper_id}/extract-metadata")
async def extract_metadata(paper_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("papers").select("*").eq("id", paper_id).single().execute()
    paper = result.data
    
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    # Extract metadata using AI
    metadata = await extract_paper_metadata(paper["extracted_text"])

    # Save metadata to the paper document
    supabase.table("papers").update({"metadata": metadata}).eq("id", paper_id).execute()

    return metadata

@router.get("/{paper_id}/images")
async def get_paper_images(paper_id: str, current_user: dict = Depends(get_current_user)):
    """Extract and return images embedded in the PDF file"""
    supabase = get_supabase()
    result = supabase.table("papers").select("*").eq("id", paper_id).single().execute()
    paper = result.data
    
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    file_path = paper["file_path"]
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
    
    try:
        images = extract_images_from_pdf(file_path, upload_dir, paper_id)
        return {"images": images}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract images: {str(e)}")

@router.post("/{paper_id}/bookmark")
async def toggle_bookmark(paper_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    
    # Check if bookmark exists
    result = supabase.table("bookmarks")\
        .select("*")\
        .eq("user_id", current_user["id"])\
        .eq("paper_id", paper_id)\
        .execute()
    
    existing = result.data[0] if result.data else None

    if existing:
        supabase.table("bookmarks").delete().eq("id", existing["id"]).execute()
        return {"bookmarked": False}
    else:
        supabase.table("bookmarks").insert({
            "user_id": current_user["id"],
            "paper_id": paper_id
        }).execute()
        return {"bookmarked": True}