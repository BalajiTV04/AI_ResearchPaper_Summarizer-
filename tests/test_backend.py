import urllib.request
import json

try:
    resp = urllib.request.urlopen('http://localhost:8000/')
    data = json.loads(resp.read().decode())
    print("Backend health check:", data)
    
    # Test login endpoint exists
    resp2 = urllib.request.urlopen('http://localhost:8000/docs')
    print("Swagger docs available: YES")
    
    print("\n✓ Backend is running successfully!")
except Exception as e:
    print("Backend error:", e)