"""Final MongoDB Migration Test"""
import requests
import json
import sys

BASE = "http://localhost:8000"

def log(msg):
    print(msg)
    sys.stdout.flush()

# 1. Health check
log("=== TEST 1: Health Check ===")
try:
    r = requests.get(f"{BASE}/", timeout=5)
    log(f"Health: {r.status_code} - {r.json()}")
except Exception as e:
    log(f"FAILED: {e}")

# 2. Register a new user
log("\n=== TEST 2: Register ===")
try:
    r = requests.post(f"{BASE}/auth/register", json={
        "name": "MongoDB User",
        "email": "finaltest@example.com",
        "password": "test123"
    }, timeout=5)
    log(f"Register: {r.status_code} - {r.json()}")
except Exception as e:
    log(f"FAILED: {e}")

# 3. Login
log("\n=== TEST 3: Login ===")
try:
    r = requests.post(f"{BASE}/auth/login", json={
        "email": "finaltest@example.com",
        "password": "test123"
    }, timeout=5)
    log(f"Login: {r.status_code} - {r.json()}")
    if r.status_code == 200:
        token = r.json().get("token")
        
        # 4. Get papers list (should be empty)
        log("\n=== TEST 4: Get Papers ===")
        r2 = requests.get(f"{BASE}/papers/", headers={"Authorization": f"Bearer {token}"}, timeout=5)
        log(f"Papers: {r2.status_code} - {r2.json()}")
except Exception as e:
    log(f"FAILED: {e}")

log("\n=== ALL TESTS COMPLETED ===")