"""Test the MongoDB migration using FastAPI TestClient directly"""
import sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))

from fastapi.testclient import TestClient
from main import app
import asyncio

client = TestClient(app)

# Test 1: Health check
print("=== Health Check ===")
r = client.get("/")
print(f"Status: {r.status_code}, Body: {r.json()}")

# Test 2: Register
print("\n=== Register Test ===")
r = client.post("/auth/register", json={
    "name": "MongoDB Test",
    "email": "mongotest@example.com",
    "password": "test123"
})
print(f"Status: {r.status_code}, Body: {r.json()}")

# Test 3: Login
print("\n=== Login Test ===")
r = client.post("/auth/login", json={
    "email": "mongotest@example.com",
    "password": "test123"
})
print(f"Status: {r.status_code}")
if r.status_code == 200:
    data = r.json()
    print(f"Body: {data}")
    token = data["token"]
    
    # Test 4: Papers endpoint
    print("\n=== Papers List Test ===")
    r = client.get("/papers/", headers={"Authorization": f"Bearer {token}"})
    print(f"Status: {r.status_code}, Body: {r.json()}")
else:
    print(f"Body: {r.json()}")

print("\n=== Migration Test Complete ===")