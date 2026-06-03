import asyncio
import concurrent.futures
import os
import json
import requests
from typing import Union, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

API_KEY = os.getenv("MERCURY_API_KEY", "")
API_URL = "https://api.inceptionlabs.ai/v1/chat/completions"

_thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)

def _trim(text: str, limit: int = 30000) -> str:
    return text[:limit]

def _parse_json(raw: str) -> Union[Dict, List]:
    clean = raw.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    if clean.endswith("```"):
        clean = clean[:-3]
    return json.loads(clean.strip())

async def _gen(prompt: str) -> str:
    def _sync_generate() -> str:
        try:
            payload = {
                "model": "mercury-2",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 2000
            }
            headers = {
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            }
            resp = requests.post(
                API_URL,
                json=payload,
                headers=headers,
                timeout=60
            )
            if resp.status_code == 429:
                return "⚠️ AI API quota exceeded. Please wait and try again later."
            resp.raise_for_status()
            data = resp.json()
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0].get("message", {}).get("content", "").strip()
            return ""
        except requests.exceptions.RequestException as e:
            return f"⚠️ AI service error: {str(e)}"
        except Exception as e:
            return f"⚠️ AI processing error: {str(e)}"
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_thread_pool, _sync_generate)

async def generate_short_summary(text: str) -> str:
    return await _gen(
        f"""Provide a concise yet comprehensive summary of this research paper in 4-6 well-crafted sentences.
Cover: the problem statement, the main approach/methodology, key findings/results, and the significance of the work.
Use clear and professional language. Return only the summary text.

Paper:\n\n{_trim(text)}"""
    )

async def generate_detailed_summary(text: str) -> str:
    return await _gen(
        f"""Write a thorough, detailed summary of this research paper. The summary should be 3-5 paragraphs covering:

1. **Problem & Motivation**: What problem is being addressed? Why is it important?
2. **Methodology**: What methods, models, datasets, or experimental setups were used? 
3. **Key Results**: What are the main findings, metrics, or outcomes?
4. **Analysis & Discussion**: How do the authors interpret the results? What comparisons are made?
5. **Conclusions & Future Work**: What are the main takeaways? What future directions are suggested?

Make each paragraph substantive with specific details from the paper. Return only the summary text.

Paper:\n\n{_trim(text)}"""
    )

async def generate_eli5_summary(text: str) -> str:
    return await _gen(
        f"""Explain this research paper as if explaining to someone with no technical background (like a 5-year-old). 

Use ALL of the following techniques:
- Simple everyday analogies (compare concepts to common experiences)
- Avoid jargon; if you must use a technical term, explain it in one sentence simply
- A fun, engaging tone
- Storytelling style to make it interesting
- Connect it to something the reader already knows

Make this explanation 3-5 paragraphs long with enough detail that the reader truly understands what the paper is about. Return only the explanation.

Paper:\n\n{_trim(text)}"""
    )

async def generate_key_points(text: str) -> Dict:
    prompt = """Extract comprehensive key information from this research paper.
For each category, provide 5-8 detailed bullet points (each 1-2 sentences).
Make each point specific and informative, not generic.

Return ONLY a JSON object, no markdown:
{
  "concepts": ["Detailed concept 1 with context...", "Detailed concept 2 with context...", ...],
  "methodology": ["Detailed methodology point 1...", "Detailed methodology point 2...", ...],
  "results": ["Specific result 1 with numbers/evidence...", "Specific result 2...", ...],
  "conclusions": ["Detailed conclusion 1...", "Detailed conclusion 2...", ...]
}
Paper: """ + _trim(text)
    raw = await _gen(prompt)
    try:
        return _parse_json(raw)
    except Exception:
        return {"concepts": [], "methodology": [], "results": [], "conclusions": []}

async def expand_content(text: str, pattern: str, section: str = "all") -> str:
    """Generate expanded content for a specific pattern type"""
    prompts = {
        "short": f"""I need you to EXPAND the SHORT SUMMARY of this research paper with MORE details and information.
Write 5-7 comprehensive sentences covering:
- The core problem being solved and why it matters
- The key innovation or approach used
- The most important results or findings (with specific numbers/evidence if available)
- The broader impact or significance

Return only the expanded summary text.

Paper:\n\n{_trim(text)}""",
        
        "detailed": f"""I need you to EXPAND the DETAILED SUMMARY of this research paper with even MORE depth and information.
Write 6-8 detailed paragraphs covering ALL of the following sections thoroughly:

1. **Introduction & Background**: Full context of the research area, what gaps exist, why this work was needed
2. **Related Work**: How does this paper build on or differ from previous work?
3. **Methodology Deep-Dive**: Complete explanation of the approach, architecture, algorithms, datasets, experimental setup
4. **Results & Analysis**: ALL key results with specific metrics, comparisons to baselines, statistical significance
5. **Discussion**: Interpretation of results, limitations, surprising findings
6. **Conclusion & Future Directions**: Main contributions, practical implications, what's next

Each paragraph should be information-dense and reference specific aspects of the paper. Return only the expanded summary text.

Paper:\n\n{_trim(text)}""",
        
        "eli5": f"""I need you to EXPAND the SIMPLE EXPLANATION (ELI5) of this research paper with MORE engaging content.
Write a fun, story-like explanation that is 4-6 paragraphs long. Use:
- A central metaphor or analogy that runs throughout the explanation
- Comparisons to everyday things (sports, cooking, school, games, etc.)
- A narrative arc: "Imagine you're trying to..." or "Think of it like..."
- Humor and personality to keep it engaging
- Connect each technical aspect to the simple analogy

The goal is that someone with ZERO technical background would finish reading and truly understand what the paper is about and why it matters. Return only the expanded explanation.

Paper:\n\n{_trim(text)}""",
        
        "bullets": f"""I need you to EXPAND the KEY POINTS / BULLET POINTS of this research paper.
Generate 15-20 detailed bullet points covering ALL important aspects of the paper:
- Background and problem statement (2-3 bullets)
- Methodology and approach (4-5 bullets with technical specifics)
- Results and findings (4-5 bullets with specific numbers/metrics)
- Conclusions and implications (3-4 bullets)
- Any limitations or future work mentioned (2-3 bullets)

Each bullet should be 1-2 complete sentences with specific details. Return only the bullet points, each on a new line starting with "• ".

Paper:\n\n{_trim(text)}"""
    }
    
    prompt = prompts.get(pattern, prompts["detailed"])
    return await _gen(prompt)

async def generate_image_descriptions(text: str) -> Dict:
    """Extract descriptions of important figures, tables, and visual elements from the paper"""
    prompt = """Analyze this research paper and identify the important figures, tables, charts, diagrams, or visual elements mentioned in the text.
For each visual element found, provide a detailed description of what it shows.
Return ONLY a JSON array, no markdown:
[
  {
    "type": "figure/table/chart/diagram",
    "title": "Title or reference of the visual element",
    "description": "Detailed description of what this visual shows, including key data points, trends, or information",
    "page_context": "What section of the paper this appears in"
  }
]
If no specific visuals are mentioned, return an empty array [].

Paper: """ + _trim(text)
    raw = await _gen(prompt)
    try:
        result = _parse_json(raw)
        if isinstance(result, list):
            return result
        return []
    except Exception:
        return []

async def generate_quiz(text: str) -> List:
    prompt = """Read this research paper and generate 10 multiple choice questions with mixed difficulty (easy, medium, hard).
Return ONLY a JSON array, no markdown, no explanation:
[{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "A",
  "explanation": "...",
  "difficulty": "easy"
}]
Paper: """ + _trim(text)
    raw = await _gen(prompt)
    try:
        return _parse_json(raw)
    except Exception:
        return []

async def generate_quiz_by_difficulty(text: str, difficulty: str) -> List:
    difficulty_instruction = {
        "easy": """You MUST generate exactly 10 EASY multiple choice questions.
These must be basic recall questions that test simple facts, definitions, and straightforward information directly stated in the paper.
Questions should be simple to answer with obvious correct answers.
Example format:
[
  {{
    "question": "What is the main topic of this paper?",
    "options": ["A. Climate change", "B. Machine learning", "C. Quantum physics", "D. Marine biology"],
    "answer": "B",
    "explanation": "The paper focuses on machine learning techniques."
  }}
]""",
        "medium": """You MUST generate exactly 10 MEDIUM multiple choice questions.
These should test comprehension and application of concepts from the paper.
Questions may require understanding relationships between ideas.
Example format:
[
  {{
    "question": "How does the proposed method compare to traditional approaches?",
    "options": ["A. It is slower but more accurate", "B. It is faster with similar accuracy", "C. It is less accurate", "D. No comparison was made"],
    "answer": "B",
    "explanation": "The proposed method achieves similar accuracy with significantly reduced computation time."
  }}
]""",
        "hard": """You MUST generate exactly 10 HARD multiple choice questions.
These should test analysis, evaluation, and deep understanding.
Questions may require synthesizing multiple concepts from the paper.
Example format:
[
  {{
    "question": "Based on the experimental results, which modification to the proposed architecture would most likely improve performance?",
    "options": ["A. Increasing layer depth to 50", "B. Adding dropout of 0.5", "C. Reducing batch size to 8", "D. Using ReLU instead of tanh"],
    "answer": "B",
    "explanation": "The results indicated overfitting in deeper layers, so dropout would help regularize."
  }}
]"""
    }.get(difficulty, "Generate exactly 10 multiple choice questions of mixed difficulty.")
    
    prompt = f"""Read this research paper very carefully.
{difficulty_instruction}

CRITICAL: Return ONLY a valid JSON array of exactly 10 objects. No markdown, no code fences, no extra text.
Each object MUST have: "question", "options" (array of 4 with A./B./C./D. prefix), "answer" (single letter A-D), "explanation".

Paper content: """ + _trim(text)
    raw = await _gen(prompt)
    try:
        result = _parse_json(raw)
        if isinstance(result, list) and len(result) > 0:
            return result[:10]
        return []
    except Exception:
        return []

async def extract_paper_metadata(text: str) -> Dict:
    """Extract metadata from a research paper using AI: authors, publication date, foundation, etc."""
    prompt = """Analyze this research paper and extract the following metadata information.
Return ONLY a valid JSON object, no markdown, no explanation:
{
  "authors": ["Author Name 1", "Author Name 2", ...],
  "publication_date": "YYYY-MM-DD if found, otherwise a best estimate or null",
  "foundation": "University, research institute, company, or organization that produced this paper. Use the full name.",
  "journal": "Journal name, conference name, or venue where published (if mentioned, otherwise null)",
  "doi": "DOI if mentioned (otherwise null)"
}

If authors are not clearly listed, return an empty array for authors.
If publication date is not found, set it to null.
If foundation/organization is not clearly stated, set it to null.

CRITICAL: Return ONLY valid JSON. No markdown code fences, no extra text.

Paper: """ + _trim(text)
    raw = await _gen(prompt)
    try:
        result = _parse_json(raw)
        # Ensure expected keys exist
        if not isinstance(result, dict):
            return {"authors": [], "publication_date": None, "foundation": None, "journal": None, "doi": None}
        return {
            "authors": result.get("authors", []),
            "publication_date": result.get("publication_date", None),
            "foundation": result.get("foundation", None),
            "journal": result.get("journal", None),
            "doi": result.get("doi", None)
        }
    except Exception:
        return {"authors": [], "publication_date": None, "foundation": None, "journal": None, "doi": None}

async def generate_ppt_content(text: str) -> List:
    prompt = """Read this research paper and generate 8 presentation slides.
Return ONLY a JSON array, no markdown, no explanation:
[{
  "title": "slide title",
  "bullets": ["point 1", "point 2", "point 3"]
}]
Paper: """ + _trim(text)
    raw = await _gen(prompt)
    try:
        return _parse_json(raw)
    except Exception:
        return []
