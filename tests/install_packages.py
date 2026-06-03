import subprocess, sys

packages = [
    "fastapi", "uvicorn", "python-multipart", "mysql-connector-python",
    "google-generativeai", "openai", "python-jose", "passlib", "pymupdf", "python-dotenv"
]

result = subprocess.run(
    [sys.executable, "-m", "pip", "install"] + packages,
    capture_output=True, text=True, timeout=120
)
print("STDOUT:", result.stdout[-500:] if result.stdout else "")
print("STDERR:", result.stderr[-500:] if result.stderr else "")
print("Return code:", result.returncode)

# Verify
for pkg in ["uvicorn", "fastapi", "mysql.connector", "google.generativeai"]:
    try:
        __import__(pkg.replace("google.generativeai", "google.generativeai").split(".")[0])
        print(f"{pkg}: OK")
    except:
        print(f"{pkg}: FAIL")