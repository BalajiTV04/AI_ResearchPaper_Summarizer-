-- ============================================================
-- Clear all data from the database
-- Run this in Supabase SQL Editor to reset all data
-- WARNING: This will delete ALL existing data permanently!
-- ============================================================

-- Clear data from all tables (order matters due to foreign keys)
DELETE FROM chat_history;
DELETE FROM bookmarks;
DELETE FROM ppt_content;
DELETE FROM quizzes;
DELETE FROM summaries;
DELETE FROM papers;
DELETE FROM profiles;

-- Also delete all auth users (this removes registered users too)
DELETE FROM auth.users;

-- ============================================================
-- Alternative: Drop and recreate all tables (more thorough)
-- Uncomment below if you want a complete reset
-- ============================================================

-- DROP TABLE IF EXISTS chat_history CASCADE;
-- DROP TABLE IF EXISTS bookmarks CASCADE;
-- DROP TABLE IF EXISTS ppt_content CASCADE;
-- DROP TABLE IF EXISTS quizzes CASCADE;
-- DROP TABLE IF EXISTS summaries CASCADE;
-- DROP TABLE IF EXISTS papers CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;