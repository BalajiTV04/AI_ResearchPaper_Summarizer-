import asyncio
import requests

BASE = "http://localhost:8000"

def test_health():
    r = requests.get(f"{BASE}/", timeout=5)
    print(f"Health check: {r.json()}")

def test_register():
    r = requests.post(f"{BASE}/auth/register", json={
        "name": "Test User",
        "email": "test_mongo@example.com",
        "password": "test123"
    }, timeout=5)
    print(f"Register: {r.status_code} - {r.json()}")

def test_login():
    r = requests.post(f"{BASE}/auth/login", json={
        "email": "test_mongo@example.com",
        "password": "test123"
    }, timeout=5)
    print(f"Login: {r.status_code} - {r.json()}")
    if r.status_code == 200:
        return r.json().get("token")
    return None

if __name__ == "__main__":
    print("=== MongoDB Migration Test ===")
    test_health()
    test_register()
    token = test_login()
    if token:
        headers = {"Authorization": f"Bearer {token}"}
        r = requests.get(f"{BASE}/papers/", headers=headers, timeout=5)
        print(f"Get papers: {r.status_code} - {r.json()}")
    print("=== Test Complete ===")