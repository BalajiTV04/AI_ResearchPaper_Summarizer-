import subprocess
import sys
import os

if __name__ == "__main__":
    # Change to project directory
    project_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_dir)

    # Verify uvicorn is available
    try:
        import uvicorn
        print("uvicorn available:", uvicorn.__version__)
    except ImportError:
        print("Installing uvicorn and fastapi...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "uvicorn", "fastapi", "mysql-connector-python", "python-multipart", "python-dotenv"])
        import uvicorn
        print("Installation complete")

    # Start the server
    print("Starting backend server on http://localhost:8000...")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000)