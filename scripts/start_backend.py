"""Simple script to start the backend server"""
import sys
import os

# Change to backend directory
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(script_dir, "..", "backend")
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

# Import and run uvicorn
import uvicorn
print("Starting Backend Server on http://localhost:8000...")
uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)