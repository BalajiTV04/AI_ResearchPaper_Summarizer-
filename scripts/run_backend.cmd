@echo off
cd /d d:\project\AI-Based Research Paper Summarizer\backend
echo Installing packages...
python -m pip install fastapi uvicorn python-multipart motor pymongo google-generativeai openai python-jose passlib pymupdf python-dotenv
echo.
echo Starting backend server...
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause