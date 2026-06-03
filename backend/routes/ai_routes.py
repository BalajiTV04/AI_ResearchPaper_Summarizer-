from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import asyncio
import io
from auth import get_current_user
from models import papers_collection, summaries_collection, quizzes_collection, ppt_collection
from database import str_to_id
from services.ai_service import (
    generate_short_summary,
    generate_detailed_summary,
    generate_eli5_summary,
    generate_key_points,
    generate_quiz,
    generate_quiz_by_difficulty,
    generate_ppt_content,
    expand_content,
    generate_image_descriptions,
)
from services.ppt_generator import create_pptx
import json

router = APIRouter(prefix="/ai", tags=["AI Services"])

@router.post("/summarize/{paper_id}")
async def summarize(paper_id: str, current_user: dict = Depends(get_current_user)):
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    text = paper["extracted_text"]
    short, detailed, eli5 = await asyncio.gather(
        generate_short_summary(text),
        generate_detailed_summary(text),
        generate_eli5_summary(text),
    )

    await summaries_collection.insert_one({
        "paper_id": paper_id,
        "short_summary": short,
        "detailed_summary": detailed,
        "eli5_summary": eli5,
        "key_points": None
    })

    return {"short_summary": short, "detailed_summary": detailed, "eli5_summary": eli5}

@router.post("/keypoints/{paper_id}")
async def keypoints(paper_id: str, current_user: dict = Depends(get_current_user)):
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    key_points = await generate_key_points(paper["extracted_text"])

    await summaries_collection.update_one(
        {"paper_id": paper_id},
        {"$set": {"key_points": key_points}}
    )

    return key_points

@router.get("/quiz/{paper_id}")
async def get_quiz(paper_id: str, current_user: dict = Depends(get_current_user)):
    quiz_data = await quizzes_collection.find_one({"paper_id": paper_id})
    if not quiz_data:
        raise HTTPException(status_code=404, detail="No quiz found for this paper")
    return {"questions": quiz_data.get("questions", [])}

@router.post("/quiz/{paper_id}")
async def generate_quiz_items(paper_id: str, current_user: dict = Depends(get_current_user)):
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    questions = await generate_quiz(paper["extracted_text"])

    await quizzes_collection.insert_one({
        "paper_id": paper_id,
        "questions": questions
    })

    return {"questions": questions}

@router.get("/ppt/{paper_id}")
async def get_ppt(paper_id: str, current_user: dict = Depends(get_current_user)):
    ppt_data = await ppt_collection.find_one({"paper_id": paper_id})
    if not ppt_data:
        raise HTTPException(status_code=404, detail="No presentation found for this paper")
    return {"slides": ppt_data.get("slides", [])}

@router.get("/quiz/{paper_id}/results")
async def get_quiz_results(paper_id: str, current_user: dict = Depends(get_current_user)):
    """Get quiz results for all difficulty levels"""
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")
    
    cursor = quizzes_collection.find({"paper_id": paper_id})
    results = {}
    async for row in cursor:
        diff = row.get("difficulty", "mixed")
        questions = row.get("questions", [])
        results[diff] = {
            "total": len(questions),
            "questions": questions
        }
    
    if not results:
        raise HTTPException(status_code=404, detail="No quiz data found for this paper")
    
    return results

@router.get("/quiz/{paper_id}/{difficulty}")
async def get_quiz_by_difficulty(paper_id: str, difficulty: str, current_user: dict = Depends(get_current_user)):
    if difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(status_code=400, detail="Difficulty must be easy, medium, or hard")
    quiz_data = await quizzes_collection.find_one({"paper_id": paper_id, "difficulty": difficulty})
    if not quiz_data:
        raise HTTPException(status_code=404, detail=f"No {difficulty} quiz found for this paper")
    return {"questions": quiz_data.get("questions", []), "difficulty": difficulty}

@router.post("/quiz/{paper_id}/{difficulty}")
async def generate_quiz_items_by_difficulty(paper_id: str, difficulty: str, current_user: dict = Depends(get_current_user)):
    if difficulty not in ["easy", "medium", "hard"]:
        raise HTTPException(status_code=400, detail="Difficulty must be easy, medium, or hard")
    
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    questions = await generate_quiz_by_difficulty(paper["extracted_text"], difficulty)

    # Upsert: replace questions for this difficulty level
    await quizzes_collection.update_one(
        {"paper_id": paper_id, "difficulty": difficulty},
        {"$set": {"questions": questions}},
        upsert=True
    )

    return {"questions": questions, "difficulty": difficulty}

@router.post("/ppt/{paper_id}")
async def generate_ppt(paper_id: str, current_user: dict = Depends(get_current_user)):
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    slides = await generate_ppt_content(paper["extracted_text"])

    await ppt_collection.insert_one({
        "paper_id": paper_id,
        "slides": slides
    })

    return {"slides": slides}

@router.post("/expand/{paper_id}/{pattern}")
async def expand_summary(paper_id: str, pattern: str, current_user: dict = Depends(get_current_user)):
    """Expand content for a specific pattern: short, detailed, eli5, bullets"""
    if pattern not in ["short", "detailed", "eli5", "bullets"]:
        raise HTTPException(status_code=400, detail="Pattern must be short, detailed, eli5, or bullets")
    
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    expanded = await expand_content(paper["extracted_text"], pattern)
    return {"content": expanded, "pattern": pattern}

@router.post("/images/{paper_id}")
async def describe_images(paper_id: str, current_user: dict = Depends(get_current_user)):
    """Extract and describe important images/figures from the paper"""
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    images = await generate_image_descriptions(paper["extracted_text"])
    return {"images": images}

@router.post("/ppt/{paper_id}/regenerate")
async def regenerate_ppt(paper_id: str, current_user: dict = Depends(get_current_user)):
    """Regenerate presentation with enhanced prompt"""
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    # Use a more detailed prompt for regeneration
    prompt_text = f"""Read this research paper and create 10 comprehensive presentation slides that cover ALL key aspects.
Each slide must have a clear title and 4-6 detailed bullet points.
Return ONLY a JSON array, no markdown:
[{{
  "title": "slide title",
  "bullets": ["detailed point 1", "detailed point 2", "detailed point 3", "detailed point 4"]
}}]

Paper content: {paper['extracted_text'][:30000]}"""
    
    from services.ai_service import _gen, _parse_json
    raw = await _gen(prompt_text)
    try:
        slides = _parse_json(raw)
        if not isinstance(slides, list) or len(slides) == 0:
            slides = [{"title": "Overview", "bullets": ["Key findings from the paper"]}]
    except Exception:
        slides = [{"title": "Overview", "bullets": ["Key findings from the paper"]}]

    # Upsert the new slides
    await ppt_collection.update_one(
        {"paper_id": paper_id},
        {"$set": {"slides": slides}},
        upsert=True
    )

    return {"slides": slides}

@router.post("/ppt/{paper_id}/download")
async def download_ppt(paper_id: str, current_user: dict = Depends(get_current_user)):
    """Download presentation as .pptx file"""
    paper = await papers_collection.find_one({"_id": str_to_id(paper_id)})
    if not paper or paper["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Paper not found or unauthorized")

    ppt_data = await ppt_collection.find_one({"paper_id": paper_id})
    if not ppt_data or not ppt_data.get("slides"):
        raise HTTPException(status_code=404, detail="No presentation found. Generate PPT first.")

    slides = ppt_data["slides"]
    buffer = create_pptx(slides, paper.get("title", "Research Paper"))
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={
            "Content-Disposition": f'attachment; filename="presentation-{paper_id[:8]}.pptx"'
        }
    )
