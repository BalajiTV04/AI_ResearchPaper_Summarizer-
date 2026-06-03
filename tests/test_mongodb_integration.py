"""Direct MongoDB integration test"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend"))

import asyncio
import motor.motor_asyncio
from passlib.context import CryptContext

async def test_mongodb():
    print("=== Testing MongoDB Connection ===")
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
        db = client.research_summarizer
        result = await db.command("ping")
        print(f"Connection: OK - {result}")
    except Exception as e:
        print(f"Connection: FAILED - {e}")
        return

    hashed = "dummy_hashed_password"

    # Test User Operations
    print("\n=== Testing User Operations ===")
    
    # Clean up any test user
    await db.users.delete_many({"email": "test_integration@example.com"})
    
    # Insert user
    result = await db.users.insert_one({
        "name": "Integration Test",
        "email": "test_integration@example.com",
        "password_hash": hashed
    })
    user_id = result.inserted_id
    print(f"User Created: {user_id}")

    # Find user
    user = await db.users.find_one({"email": "test_integration@example.com"})
    print(f"User Found: {user['name']} - {user['email']}")
    
    # Test Paper Operations
    print("\n=== Testing Paper Operations ===")
    paper_result = await db.papers.insert_one({
        "user_id": str(user_id),
        "title": "Test Paper",
        "filename": "test.pdf",
        "file_path": "./uploads/test.pdf",
        "extracted_text": "This is test paper content for integration testing.",
        "page_count": 5
    })
    paper_id = paper_result.inserted_id
    print(f"Paper Created: {paper_id}")

    # Test Summary Operations
    print("\n=== Testing Summary Operations ===")
    await db.summaries.insert_one({
        "paper_id": str(paper_id),
        "short_summary": "Short test summary",
        "detailed_summary": "Detailed test summary content",
        "eli5_summary": "ELI5 test summary",
        "key_points": None
    })
    print("Summary Created")

    # Test Quiz Operations
    print("\n=== Testing Quiz Operations ===")
    await db.quizzes.insert_one({
        "paper_id": str(paper_id),
        "questions": [{"q": "Test question?", "a": "Test answer"}]
    })
    print("Quiz Created")

    # Test PPT Operations
    print("\n=== Testing PPT Operations ===")
    await db.ppt_content.insert_one({
        "paper_id": str(paper_id),
        "slides": [{"slide1": "Test slide content"}]
    })
    print("PPT Created")

    # Test Chat Operations
    print("\n=== Testing Chat Operations ===")
    await db.chat_history.insert_one({
        "paper_id": str(paper_id),
        "user_id": str(user_id),
        "role": "user",
        "content": "Hello, this is a test message"
    })
    await db.chat_history.insert_one({
        "paper_id": str(paper_id),
        "user_id": str(user_id),
        "role": "assistant",
        "content": "Hello! I'm here to help with your paper."
    })
    print("Chat Messages Created")

    # Test Bookmark Operations
    print("\n=== Testing Bookmark Operations ===")
    await db.bookmarks.insert_one({
        "user_id": str(user_id),
        "paper_id": str(paper_id)
    })
    print("Bookmark Created")

    # Verify all data
    print("\n=== Verification ===")
    user_count = await db.users.count_documents({})
    paper_count = await db.papers.count_documents({})
    summary_count = await db.summaries.count_documents({})
    quiz_count = await db.quizzes.count_documents({})
    ppt_count = await db.ppt_content.count_documents({})
    chat_count = await db.chat_history.count_documents({})
    bookmark_count = await db.bookmarks.count_documents({})
    
    print(f"Users: {user_count}")
    print(f"Papers: {paper_count}")
    print(f"Summaries: {summary_count}")
    print(f"Quizzes: {quiz_count}")
    print(f"PPT Content: {ppt_count}")
    print(f"Chat History: {chat_count}")
    print(f"Bookmarks: {bookmark_count}")
    
    # Clean up
    await db.users.delete_many({"email": "test_integration@example.com"})
    await db.papers.delete_many({"_id": paper_id})
    print("\n=== Cleanup Complete ===")
    
    client.close()
    print("\n=== ALL MONGODB TESTS PASSED ===")

if __name__ == "__main__":
    asyncio.run(test_mongodb())