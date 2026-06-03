import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from auth import get_current_user
from models import papers_collection, bookmarks_collection
from database import str_to_id, id_to_str
from services.pdf_service import extract_text_from_pdf, save_uploaded_file
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

    paper_doc = {
        "user_id": current_user["id"],
        "title": title,
        "filename": filename,
        "file_path": file_path,
        "extracted_text": text,
        "page_count": page_count,
        "uploaded_at": datetime.utcnow()
    }
    result = await papers_collection.insert_one(paper_doc)

    return {"paper_id": str(result.inserted_id), "title": title, "page_count": page_count}

@router.get("/")
async def get_papers(current_user: dict = Depends(get_current_user)):
    cursor = papers_collection.find({"user_id": current_user["id"]})
    papers = []
    async for doc in cursor.sort("uploaded_at", -1):
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        doc.pop("extracted_text", None)
        papers.append(doc)
    return papers

@router.get("/{paper_id}")
async def get_paper(paper_id: str, current_user: dict = Depends(get_current_user)):
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    paper["id"] = str(paper["_id"])
    paper.pop("_id", None)
    return paper

@router.delete("/{paper_id}")
async def delete_paper(paper_id: str, current_user: dict = Depends(get_current_user)):
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    if os.path.exists(paper.get("file_path", "")):
        os.remove(paper["file_path"])

    await papers_collection.delete_one({"_id": str_to_id(paper_id)})
    return {"message": "Paper deleted successfully"}

@router.post("/{paper_id}/extract-metadata")
async def extract_metadata(paper_id: str, current_user: dict = Depends(get_current_user)):
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    # Extract metadata using AI
    metadata = await extract_paper_metadata(paper["extracted_text"])

    # Save metadata to the paper document
    await papers_collection.update_one(
        {"_id": str_to_id(paper_id)},
        {"$set": {"metadata": metadata}}
    )

    return metadata

@router.post("/{paper_id}/bookmark")
async def toggle_bookmark(paper_id: str, current_user: dict = Depends(get_current_user)):
    existing = await bookmarks_collection.find_one({
        "user_id": current_user["id"],
        "paper_id": paper_id
    })

    if existing:
        await bookmarks_collection.delete_one({"_id": existing["_id"]})
        return {"bookmarked": False}
    else:
        await bookmarks_collection.insert_one({
            "user_id": current_user["id"],
            "paper_id": paper_id
        })
        return {"bookmarked": True}