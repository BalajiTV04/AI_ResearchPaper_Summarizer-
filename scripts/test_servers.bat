@echo off
echo Testing Backend...
curl -s http://localhost:8000/ 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Backend is running!
) else (
    echo [FAIL] Backend not responding!
)
echo.
echo Testing Frontend...
curl -s http://localhost:3000/ 2>nul > nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Frontend is running!
) else (
    echo [FAIL] Frontend not responding!
)
echo.
echo Done!
pause