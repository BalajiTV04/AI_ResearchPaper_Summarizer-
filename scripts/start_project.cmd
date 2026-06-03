@echo off
cd /d d:\project\AI-Based Research Paper Summarizer
echo ============================
echo Installing Python packages...
echo ============================
python -m pip install --upgrade pip > pip_output.txt 2>&1
python -m pip install uvicorn fastapi python-multipart mysql-connector-python google-generativeai openai python-jose passlib pymupdf python-dotenv > install_output.txt 2>&1
echo Package installation complete.
echo.
echo ============================
echo Starting Backend Server...
echo ============================
start /B python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload > backend_output.txt 2>&1
echo Backend server started on http://localhost:8000
echo Check backend_output.txt for logs.
echo.
echo ============================
echo Testing backend connection...
echo ============================
timeout /t 5 /nobreak >nul
cd scripts
python ..\tests\test_api.py > ..\api_test_result.txt 2>&1
type ..\api_test_result.txt
echo.
echo Done!