"""
Unified start script for AI Research Paper Summarizer Backend
Simply run: python start.py
Use reload mode with: python start.py --reload
"""
import os
import sys

# Step 1: Change to backend directory so all imports work correctly
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(script_dir, "..", "backend")
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

# Step 2: Import and run uvicorn
import uvicorn

if __name__ == "__main__":
    use_reload = "--reload" in sys.argv

    print("=" * 55)
    print("  AI Research Paper Summarizer - Backend Server")
    print("=" * 55)
    print(f"  Working directory: {backend_dir}")
    print()
    print("  Starting server on http://localhost:8000")
    print("  API Docs: http://localhost:8000/docs")
    print("  Reload: " + ("ON (--reload)" if use_reload else "OFF (use --reload to enable)"))
    print("=" * 55)


    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=use_reload)