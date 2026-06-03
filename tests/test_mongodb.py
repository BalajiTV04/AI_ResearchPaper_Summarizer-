import asyncio
import motor.motor_asyncio
import os

async def test_connection():
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
        admin = client.admin
        result = await admin.command("ping")
        print(f"MongoDB connection successful: {result}")
        
        # Test inserting a document
        db = client.test_db
        col = db.test_collection
        insert_result = await col.insert_one({"test": "hello"})
        print(f"Insert test successful: {insert_result.inserted_id}")
        
        # Clean up
        await col.delete_one({"_id": insert_result.inserted_id})
        client.close()
        return True
    except Exception as e:
        print(f"MongoDB connection FAILED: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_connection())