import subprocess
import sys
import time
import os

# Install packages
print("Installing packages...")
packages = [
    "fastapi", "uvicorn", "python-multipart", "mysql-connector-python",
    "google-generativeai", "openai", "python-jose[cryptography]",
    "passlib[bcrypt]", "pymupdf", "python-dotenv"
]
subprocess.check_call([sys.executable, "-m", "pip", "install"] + packages)
print("Packages installed successfully!")

# Import and run fastapi
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import uvicorn
print("Starting backend server on http://localhost:8000...")
uvicorn.run("backend.main:app", host="0.0.0.0", port=8000)