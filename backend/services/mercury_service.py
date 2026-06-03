from typing import Optional
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

_client: Optional[AsyncOpenAI] = None

def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=os.getenv("MERCURY_API_KEY", ""),
            base_url="https://api.inceptionlabs.ai/v1",
        )
    return _client

async def chat_with_paper(paper_text: str, history: list, user_question: str) -> str:
    client = _get_client()
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert research assistant. "
                "Answer questions ONLY using the research paper content below. "
                "Do not use outside knowledge. "
                "If the answer is not in the paper, say 'This information is not found in the paper.'\n\n"
                "IMPORTANT FORMATTING RULES: "
                "1. Keep responses SHORT and CONCISE (max 3-4 sentences). "
                "2. Use bullet points (•) when listing multiple items. "
                "3. Bold important terms by wrapping them in **double asterisks**. "
                "4. Use short paragraphs separated by blank lines. "
                "5. NEVER return raw JSON or markdown code blocks. "
                "6. Be direct - answer immediately without preambles like 'Based on the paper...'.\n\n"
                f"PAPER CONTENT:\n{paper_text[:25000]}"
            ),
        }
    ]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_question})

    response = await client.chat.completions.create(
        model="mercury-2",
        messages=messages,
        max_tokens=1000,
    )
    return response.choices[0].message.content
