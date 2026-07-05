-- ============================================================
-- Supabase Migration Script for AI Research Paper Summarizer
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES TABLE (extends Supabase Auth users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'name',
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================
-- 2. PAPERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    filename TEXT,
    file_path TEXT,
    extracted_text TEXT,
    page_count INTEGER,
    metadata JSONB,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE papers ENABLE ROW LEVEL SECURITY;

-- Users can only see their own papers
CREATE POLICY "Users can view own papers"
    ON papers FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own papers
CREATE POLICY "Users can insert own papers"
    ON papers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own papers
CREATE POLICY "Users can update own papers"
    ON papers FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own papers
CREATE POLICY "Users can delete own papers"
    ON papers FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_papers_user_id ON papers(user_id);
CREATE INDEX IF NOT EXISTS idx_papers_uploaded_at ON papers(uploaded_at DESC);

-- ============================================================
-- 3. SUMMARIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    short_summary TEXT,
    detailed_summary TEXT,
    eli5_summary TEXT,
    key_points JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Users can access summaries for their papers (via paper ownership)
CREATE POLICY "Users can view summaries via papers"
    ON summaries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = summaries.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert summaries via papers"
    ON summaries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = summaries.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update summaries via papers"
    ON summaries FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = summaries.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_summaries_paper_id ON summaries(paper_id);

-- ============================================================
-- 4. QUIZZES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    difficulty TEXT DEFAULT 'mixed',
    questions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quizzes via papers"
    ON quizzes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = quizzes.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert quizzes via papers"
    ON quizzes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = quizzes.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update quizzes via papers"
    ON quizzes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = quizzes.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete quizzes via papers"
    ON quizzes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = quizzes.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_quizzes_paper_id ON quizzes(paper_id);

-- ============================================================
-- 5. PPT CONTENT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ppt_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    slides JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ppt_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ppt via papers"
    ON ppt_content FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = ppt_content.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert ppt via papers"
    ON ppt_content FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = ppt_content.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update ppt via papers"
    ON ppt_content FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = ppt_content.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete ppt via papers"
    ON ppt_content FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = ppt_content.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_ppt_paper_id ON ppt_content(paper_id);

-- ============================================================
-- 6. CHAT HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat via papers"
    ON chat_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = chat_history.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert chat via papers"
    ON chat_history FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = chat_history.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete chat via papers"
    ON chat_history FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM papers
            WHERE papers.id = chat_history.paper_id
            AND papers.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_chat_paper_id ON chat_history(paper_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_history(created_at);

-- ============================================================
-- 7. BOOKMARKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, paper_id)
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
    ON bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
    ON bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
    ON bookmarks FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_paper_id ON bookmarks(paper_id);

-- ============================================================
-- 8. ADMIN USER SETUP
-- ============================================================
-- Note: The admin user will be created automatically by the backend
-- when the admin login endpoint is called for the first time.
-- Make sure to insert admin credentials in your .env file.