import asyncio
import concurrent.futures
import os
import json
import time
import socket
import requests
from typing import Union, Dict, List, Optional
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

API_KEY = os.getenv("MERCURY_API_KEY", "")
API_URL = "https://api.inceptionlabs.ai/v1/chat/completions"

_thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)

# ─── Token Optimization Settings ───
# Character truncation limits per task type (not all tasks need full paper text)
_TRUNCATION_LIMITS = {
    "short": 8000,
    "detailed": 25000,
    "eli5": 8000,
    "keypoints": 12000,
    "quiz": 15000,
    "ppt": 20000,
    "metadata": 6000,
    "images": 12000,
    "bullets": 12000,
    "expand_short": 4000,
    "expand_detailed": 10000,
    "expand_eli5": 4000,
    "expand_bullets": 6000,
}

# Output token limits per task type (don't waste tokens on simple tasks)
_MAX_TOKENS = {
    "short": 300,
    "detailed": 2000,
    "eli5": 500,
    "keypoints": 1000,
    "quiz": 2000,
    "ppt": 2000,
    "metadata": 300,
    "images": 1000,
    "bullets": 1000,
    "expand_short": 500,
    "expand_detailed": 2000,
    "expand_eli5": 800,
    "expand_bullets": 1200,
}

_DEFAULT_TRUNCATION = 30000
_DEFAULT_MAX_TOKENS = 2000

# Custom exception for AI service errors
class AIServiceError(Exception):
    """Raised when the AI service fails to generate valid content."""
    pass


def _trim(text: str, task_type: str = "detailed") -> str:
    """Truncate text to the appropriate limit for the given task type."""
    limit = _TRUNCATION_LIMITS.get(task_type, _DEFAULT_TRUNCATION)
    return text[:limit]


def _is_retryable_error(e: Exception) -> bool:
    """Check if the error is transient and worth retrying."""
    if isinstance(e, requests.exceptions.ConnectionError):
        return True
    if isinstance(e, requests.exceptions.Timeout):
        return True
    if isinstance(e, requests.exceptions.HTTPError):
        if hasattr(e, 'response') and e.response is not None:
            return 500 <= e.response.status_code < 600
        return False
    if isinstance(e, socket.gaierror):
        return True
    return False


def _parse_json(raw: str) -> Union[Dict, List]:
    clean = raw.strip()
    if clean.startswith("```json"):
        clean = clean[7:]
    if clean.endswith("```"):
        clean = clean[:-3]
    return json.loads(clean.strip())


async def _gen(prompt: str, task_type: str = "detailed") -> str:
    """Send a prompt to the AI API with retry logic.
    
    Args:
        prompt: The complete prompt text to send.
        task_type: Key into _TRUNCATION_LIMITS and _MAX_TOKENS for optimization.
    
    Raises:
        AIServiceError: If the AI service fails after all retries.
    """
    max_output_tokens = _MAX_TOKENS.get(task_type, _DEFAULT_MAX_TOKENS)
    
    def _sync_generate() -> str:
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                payload = {
                    "model": "mercury-2",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": max_output_tokens
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
                    raise AIServiceError("AI API quota exceeded. Please wait and try again later.")
                resp.raise_for_status()
                data = resp.json()
                if "choices" in data and len(data["choices"]) > 0:
                    content = data["choices"][0].get("message", {}).get("content", "").strip()
                    if content:
                        return content
                raise AIServiceError("AI service returned empty response.")
            except requests.exceptions.HTTPError as e:
                if e.response is not None and 400 <= e.response.status_code < 500 and e.response.status_code != 429:
                    raise AIServiceError(f"AI service error: {str(e)}") from e
                last_error = e
                if _is_retryable_error(e) and attempt < max_retries - 1:
                    time.sleep((2 ** attempt))
                    continue
                raise AIServiceError(f"AI service error after {max_retries} retries: {str(e)}") from e
            except requests.exceptions.ConnectionError as e:
                last_error = e
                if attempt < max_retries - 1:
                    time.sleep((2 ** attempt))
                    continue
                raise AIServiceError("AI service connection failed. Please check your internet connection and try again.") from e
            except requests.exceptions.Timeout as e:
                last_error = e
                if attempt < max_retries - 1:
                    time.sleep((2 ** attempt))
                    continue
                raise AIServiceError("AI service timed out. The service may be overloaded. Please try again later.") from e
            except AIServiceError:
                raise
            except Exception as e:
                if _is_retryable_error(e) and attempt < max_retries - 1:
                    time.sleep((2 ** attempt))
                    last_error = e
                    continue
                raise AIServiceError(f"AI service error: {str(e)}") from e
        
        raise AIServiceError(f"AI service failed after {max_retries} retries: {last_error}")
    
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_thread_pool, _sync_generate)


# ─── Math Formatting Instruction ───
# Added to every prompt to ensure mathematical expressions are rendered correctly
_MATH_INSTR = "IMPORTANT: Format any mathematical expressions, equations, formulas, or symbols using LaTeX notation. Use $...$ for inline math (e.g., $x_i$, $\\alpha$, $E = mc^2$, $\\mathbb{R}^n$) and $$...$$ for display equations (e.g., $$\\sum_{i=1}^{n} x_i$$). Always enclose math in $$ for standalone equations."


# ─── Prompt Templates (Concise) ───

async def generate_short_summary(text: str) -> str:
    try:
        return await _gen(
            f"{_MATH_INSTR}\n\nSummarize this research paper in 4-6 sentences covering: problem, methodology, key findings, significance. Be concise.\n\nPaper:\n{_trim(text, 'short')}",
            task_type="short"
        )
    except AIServiceError:
        raise


async def generate_detailed_summary(text: str) -> dict:
    raw = await _gen(
        f"""{_MATH_INSTR}
Write a structured detailed summary of this research paper with these sections:
1. Introduction & Background - problem, importance, context
2. Methodology - methods, models, datasets, setup
3. Key Results - main findings, metrics, outcomes
4. Discussion & Analysis - interpretation, comparisons
5. Conclusions & Future Work - takeaways, future directions

Return ONLY valid JSON, no markdown:
{{"introduction":"...","methodology":"...","results":"...","discussion":"...","conclusion":"..."}}

Paper:\n{_trim(text, 'detailed')}""",
        task_type="detailed"
    )
    try:
        result = _parse_json(raw)
        if isinstance(result, dict):
            return result
        raise AIServiceError("Detailed summary response was not a valid JSON object.")
    except (json.JSONDecodeError, AIServiceError):
        # If JSON parsing fails, try to structure the raw text into sections
        # by detecting section headers
        sections = _parse_detailed_into_sections(raw)
        if sections is not None:
            return sections
        raise


def _parse_detailed_into_sections(raw_text: str) -> Optional[dict]:
    """Attempt to parse unstructured text into structured sections by detecting headers."""
    lines = raw_text.split('\n')
    sections = {
        "introduction": "",
        "methodology": "",
        "results": "",
        "discussion": "",
        "conclusion": ""
    }
    
    section_headers = {
        "introduction": ["introduction", "background", "introduction & background", "introduction and background", "problem"],
        "methodology": ["methodology", "methods", "approach", "method", "experimental setup"],
        "results": ["results", "key results", "findings", "key findings", "main findings", "outcomes"],
        "discussion": ["discussion", "analysis", "discussion & analysis", "discussion and analysis", "interpretation"],
        "conclusion": ["conclusion", "conclusions", "conclusions & future work", "conclusions and future work", "future work"]
    }
    
    current_section = None
    for line in lines:
        line_lower = line.strip().lower()
        # Check if this line matches a section header
        matched = False
        for section_name, headers in section_headers.items():
            for header in headers:
                # Match lines that start with a number followed by the header, or just the header
                if line_lower.startswith(header) or line_lower.startswith(f"1. {header}") or line_lower.startswith(f"2. {header}") or line_lower.startswith(f"3. {header}") or line_lower.startswith(f"4. {header}") or line_lower.startswith(f"5. {header}"):
                    current_section = section_name
                    matched = True
                    break
            if matched:
                break
        
        # If we're in a section and the line isn't a header itself, add it
        if current_section and not matched and line.strip():
            if sections[current_section]:
                sections[current_section] += "\n" + line.strip()
            else:
                sections[current_section] = line.strip()
    
    # Return sections only if at least one was found
    if any(val.strip() for val in sections.values()):
        return sections
    return None


async def generate_eli5_summary(text: str) -> str:
    try:
        return await _gen(
            f"""{_MATH_INSTR}\n\nExplain this research paper simply, as if to someone with no technical background. Use analogies, avoid jargon, keep engaging. 3-5 paragraphs.\n\nPaper:\n{_trim(text, 'eli5')}""",
            task_type="eli5"
        )
    except AIServiceError:
        raise


async def generate_key_points(text: str) -> Dict:
    raw = await _gen(
        f"""{_MATH_INSTR}
Extract key information from this paper into 4 categories (5-8 points each, 1-2 sentences per point).
Return ONLY JSON: {{"concepts":["..."],"methodology":["..."],"results":["..."],"conclusions":["..."]}}

Paper: {_trim(text, 'keypoints')}""",
        task_type="keypoints"
    )
    try:
        result = _parse_json(raw)
        if isinstance(result, dict) and all(k in result for k in ["concepts", "methodology", "results", "conclusions"]):
            return result
        raise AIServiceError("Key points response was not valid.")
    except (json.JSONDecodeError, AIServiceError):
        raise AIServiceError("Failed to parse key points from AI response.")


async def expand_content(text: str, pattern: str, section: str = "all") -> str:
    """Generate expanded content for a specific pattern type with optimized token usage."""
    task_map = {
        "short": ("expand_short", f"""{_MATH_INSTR}\n\nExpand this short summary with more details. Write 5-7 sentences covering: core problem, innovation, key results (with specifics), broader impact. Return only expanded text.\n\nPaper:\n{_trim(text, 'expand_short')}"""),
        "detailed": ("expand_detailed", f"""{_MATH_INSTR}\n\nExpand this detailed summary with 6-8 paragraphs covering: background, related work, methodology deep-dive, results with metrics, discussion, conclusions. Be information-dense.\n\nPaper:\n{_trim(text, 'expand_detailed')}"""),
        "eli5": ("expand_eli5", f"""{_MATH_INSTR}\n\nExpand this simple explanation into 4-6 paragraphs with a central metaphor, everyday comparisons, and a narrative arc. Make it engaging for non-technical readers.\n\nPaper:\n{_trim(text, 'expand_eli5')}"""),
        "bullets": ("expand_bullets", f"""{_MATH_INSTR}\n\nGenerate 15-20 detailed bullet points from this paper covering: problem (2-3), methodology (4-5), results with metrics (4-5), conclusions (3-4), limitations (2-3). Each bullet 1-2 sentences, starting with 'o '.\n\nPaper:\n{_trim(text, 'expand_bullets')}"""),
    }
    task_type, prompt = task_map.get(pattern, ("expand_detailed", f"Expand: {_trim(text, 'expand_detailed')}"))
    try:
        return await _gen(prompt, task_type=task_type)
    except AIServiceError:
        raise


async def generate_image_descriptions(text: str) -> List:
    raw = await _gen(
        f"""{_MATH_INSTR}
Identify all figures, tables, charts, diagrams mentioned in this paper. For each, describe what it shows.
Return ONLY JSON array: [{{"type":"figure/table","title":"...","description":"...","page_context":"..."}}] or [] if none.\n\nPaper: {_trim(text, 'images')}""",
        task_type="images"
    )
    try:
        result = _parse_json(raw)
        if isinstance(result, list):
            return result
        return []
    except (json.JSONDecodeError, AIServiceError):
        return []


async def generate_quiz(text: str) -> List:
    raw = await _gen(
        f"""{_MATH_INSTR}
Generate 10 multiple choice questions (mixed easy/medium/hard difficulty) from this paper.
Return ONLY JSON array: [{{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A","explanation":"...","difficulty":"easy"}}]\n\nPaper: {_trim(text, 'quiz')}""",
        task_type="quiz"
    )
    try:
        result = _parse_json(raw)
        if isinstance(result, list) and len(result) > 0:
            return result[:10]
        return []
    except (json.JSONDecodeError, AIServiceError):
        return []


async def generate_quiz_by_difficulty(text: str, difficulty: str) -> List:
    diff_prompts = {
        "easy": "10 EASY recall questions testing simple facts directly stated in the paper.",
        "medium": "10 MEDIUM comprehension questions testing understanding of concepts and relationships.",
        "hard": "10 HARD analysis questions testing deep understanding and synthesis of multiple concepts."
    }
    instruction = diff_prompts.get(difficulty, "Generate 10 multiple choice questions.")
    
    raw = await _gen(
        f"""{_MATH_INSTR}
{instruction}
Return ONLY JSON array of exactly 10 objects: [{{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"answer":"A-D","explanation":"..."}}]\n\nPaper: {_trim(text, 'quiz')}""",
        task_type="quiz"
    )
    try:
        result = _parse_json(raw)
        if isinstance(result, list) and len(result) > 0:
            return result[:10]
        return []
    except (json.JSONDecodeError, AIServiceError):
        return []


async def extract_paper_metadata(text: str) -> Dict:
    """Extract metadata using only the beginning of the paper where it typically appears."""
    raw = await _gen(
        f"""Extract metadata from this paper. Return ONLY JSON: {{"authors":["..."],"publication_date":"YYYY-MM-DD or null","foundation":"institution name or null","journal":"venue or null","doi":"DOI or null"}}

Paper start: {_trim(text, 'metadata')}""",
        task_type="metadata"
    )
    try:
        result = _parse_json(raw)
        if not isinstance(result, dict):
            return {"authors": [], "publication_date": None, "foundation": None, "journal": None, "doi": None}
        return {
            "authors": result.get("authors", []),
            "publication_date": result.get("publication_date", None),
            "foundation": result.get("foundation", None),
            "journal": result.get("journal", None),
            "doi": result.get("doi", None)
        }
    except (json.JSONDecodeError, AIServiceError):
        return {"authors": [], "publication_date": None, "foundation": None, "journal": None, "doi": None}


async def generate_ppt_content(text: str) -> List:
    raw = await _gen(
        f"""{_MATH_INSTR}
Create 8 presentation slides from this paper.
Return ONLY JSON array: [{{"title":"slide title","bullets":["point 1","point 2","point 3","point 4"]}}]\n\nPaper: {_trim(text, 'ppt')}""",
        task_type="ppt"
    )
    try:
        return _parse_json(raw)
    except (json.JSONDecodeError, AIServiceError):
        return []