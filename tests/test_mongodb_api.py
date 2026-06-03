import requests
import json

BASE = "http://localhost:8000"

# 1. Health check
print("=== Testing Health Check ===")
try:
    r = requests.get(f"{BASE}/", timeout=5)
    print(f"Health: {r.json()}")
except Exception as e:
    print(f"Health check FAILED: {e}")

# 2. Register a test user
print("\n=== Testing Registration ===")
try:
    r = requests.post(f"{BASE}/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "test123"
    }, timeout=5)
    print(f"Register: {r.json()}")
except Exception as e:
    print(f"Register FAILED: {e}")

# 3. Login
print("\n=== Testing Login ===")
try:
    r = requests.post(f"{BASE}/auth/login", json={
        "email": "test@example.com",
        "password": "test123"
    }, timeout=5)
    print(f"Login: {r.json()}")
except Exception as e:
    print(f"Login FAILED: {e}")

print("\n=== Test Complete ===")