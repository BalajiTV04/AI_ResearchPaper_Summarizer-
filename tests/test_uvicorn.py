import sys
print("Python executable:", sys.executable)
print("Python version:", sys.version)

try:
    import uvicorn
    print("uvicorn version:", uvicorn.__version__)
except Exception as e:
    print("uvicorn import failed:", e)