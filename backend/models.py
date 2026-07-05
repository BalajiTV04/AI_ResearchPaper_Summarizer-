from database import get_supabase

# Supabase table names
USERS_TABLE = "profiles"
PAPERS_TABLE = "papers"
SUMMARIES_TABLE = "summaries"
QUIZZES_TABLE = "quizzes"
PPT_TABLE = "ppt_content"
CHAT_TABLE = "chat_history"
BOOKMARKS_TABLE = "bookmarks"

def get_table(table_name: str):
    """Get a Supabase table reference"""
    supabase = get_supabase()
    return supabase.table(table_name)

# Convenience references
users_table = lambda: get_table(USERS_TABLE)
papers_table = lambda: get_table(PAPERS_TABLE)
summaries_table = lambda: get_table(SUMMARIES_TABLE)
quizzes_table = lambda: get_table(QUIZZES_TABLE)
ppt_table = lambda: get_table(PPT_TABLE)
chat_table = lambda: get_table(CHAT_TABLE)
bookmarks_table = lambda: get_table(BOOKMARKS_TABLE)