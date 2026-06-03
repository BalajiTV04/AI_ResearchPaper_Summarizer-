"""
Quick test: verifies imports work correctly and starts the server.
Usage: python quick_test.py
"""
import sys
import os

# Set up path for backend imports
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, backend_dir)

# Test 1: Core imports
print("=" * 50)
print("TEST 1: Verifying all imports...")
print("=" * 50)

try:
    from main import app
    print(f"  ✅ main.py loaded OK - {len(app.routes)} routes registered")
    
    # Show routes
    for r in app.routes:
        if hasattr(r, 'methods') and hasattr(r, 'path'):
            methods = ','.join(sorted(r.methods))
            print(f"     {methods} {r.path}")
except Exception as e:
    print(f"  ❌ Import failed: {e}")
    sys.exit(1)

# Test 2: Database connection
print()
print("=" * 50)
print("TEST 2: Checking MongoDB connectivity...")
print("=" * 50)
try:
    import motor.motor_asyncio
    import asyncio
    
    async def check_mongo():
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=3000)
        try:
            await client.admin.command('ping')
            print("  ✅ MongoDB is running and connected!")
            return True
        except Exception as e:
            print(f"  ⚠️  MongoDB not reachable: {e}")
            print("     The app will load but auth/storage features won't work")
            return False
        finally:
            client.close()
    
    success = asyncio.run(check_mongo())
except Exception as e:
    print(f"  ⚠️  MongoDB check failed: {e}")
    print("     The app will load but auth/storage features won't work")

# Test 3: Start server
print()
print("=" * 50)
print("TEST 3: Starting server...")
print("=" * 50)
print("  URL: http://localhost:8000")
print("  Docs: http://localhost:8000/docs")
print()
print("  Press Ctrl+C to stop the server")
print("=" * 50)

if __name__ == "__main__":
    import uvicorn
    # Change to backend directory for proper path handling
    os.chdir(backend_dir)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)