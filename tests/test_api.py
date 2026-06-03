import urllib.request
import json

try:
    req = urllib.request.Request('http://localhost:8000/')
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read().decode())
        print("Backend is running! Response:", data)
except Exception as e:
    print("Backend check failed:", e)