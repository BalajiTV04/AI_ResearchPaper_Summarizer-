from database import get_db

# MongoDB collections
db = get_db()

users_collection = db["users"]
papers_collection = db["papers"]
summaries_collection = db["summaries"]
quizzes_collection = db["quizzes"]
ppt_collection = db["ppt_content"]
chat_collection = db["chat_history"]
bookmarks_collection = db["bookmarks"]