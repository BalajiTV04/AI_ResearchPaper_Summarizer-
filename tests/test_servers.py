import urllib.request
import json

with open('test_result.txt', 'w') as f:
    # Test Backend
    try:
        resp = urllib.request.urlopen('http://localhost:8000/', timeout=5)
        data = json.loads(resp.read().decode())
        f.write(f"✓ BACKEND OK: {data}\n")
    except Exception as e:
        f.write(f"✗ BACKEND FAIL: {e}\n")
    
    # Test Frontend
    try:
        resp = urllib.request.urlopen('http://localhost:3000/', timeout=5)
        f.write(f"✓ FRONTEND OK: HTTP {resp.status}\n")
    except Exception as e:
        f.write(f"✗ FRONTEND FAIL: {e}\n")
    
    f.write("\nBoth servers should now be accessible!\n")
    f.write("Backend API: http://localhost:8000\n")
    f.write("Frontend App: http://localhost:3000\n")
    f.write("API Docs: http://localhost:8000/docs\n")

print("Results written to test_result.txt")