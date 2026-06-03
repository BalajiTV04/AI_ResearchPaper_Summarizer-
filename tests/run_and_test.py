"""Start backend server and run tests"""
import subprocess
import sys
import time
import requests
import os
os.environ["PYTHONIOENCODING"] = "utf-8"

# Start the server in background
print("Starting backend server...", flush=True)
server_proc = subprocess.Popen(
    [sys.executable, "-u", "backend/run.py"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
)

# Wait for it to start
print("Waiting for server to start...", flush=True)
time.sleep(8)

BASE = "http://localhost:8000"
passed = 0
failed = 0

def test(name, func):
    global passed, failed
    try:
        result = func()
        print(f"  PASS - {name}: {result}", flush=True)
        passed += 1
    except Exception as e:
        print(f"  FAIL - {name}: {e}", flush=True)
        failed += 1

print("\n=== Starting MongoDB Integration Tests ===\n", flush=True)

# 1. Health check
test("Health Check", lambda: requests.get(BASE + "/", timeout=5).json())

# 2. Register user
test("Register", lambda: (
    r := requests.post(BASE + "/auth/register", json={
        "name": "TestUser", "email": "testuser@mongo.com", "password": "pass123"
    }, timeout=5),
    r.json()
)[1])

# 3. Login
test("Login", lambda: (
    r := requests.post(BASE + "/auth/login", json={
        "email": "testuser@mongo.com", "password": "pass123"
    }, timeout=5),
    r.json()
)[1])

# 4. Authenticated tests
print("\n=== Authenticated Tests ===", flush=True)
r = requests.post(BASE + "/auth/login", json={
    "email": "testuser@mongo.com", "password": "pass123"
}, timeout=5)

if r.status_code == 200:
    token = r.json()["token"]
    headers = {"Authorization": "Bearer " + token}

    # 5. Get papers
    test("Get Papers", lambda: (
        r2 := requests.get(BASE + "/papers/", headers=headers, timeout=5),
        r2.json()
    )[1])

    # 6. Verify MongoDB has user
    import asyncio
    import motor.motor_asyncio
    
    async def check_mongo():
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
        user = await client.research_summarizer.users.find_one({"email": "testuser@mongo.com"})
        client.close()
        return user is not None
    
    mongo_check = asyncio.run(check_mongo())
    print(f"  PASS - MongoDB User Check: User stored in MongoDB!" if mongo_check else f"  FAIL - MongoDB User Check: User NOT found in MongoDB", flush=True)
    if mongo_check:
        passed += 1
    else:
        failed += 1

print(f"\n{'='*40}", flush=True)
print(f"Results: {passed} passed, {failed} failed", flush=True)
print(f"{'='*40}", flush=True)

# Stop server
print("\nStopping server...", flush=True)
server_proc.terminate()
time.sleep(2)
print("Test complete.", flush=True)