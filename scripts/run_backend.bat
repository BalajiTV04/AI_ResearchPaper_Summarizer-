@echo off
cd /d d:\project\AI-Based Research Paper Summarizer\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000