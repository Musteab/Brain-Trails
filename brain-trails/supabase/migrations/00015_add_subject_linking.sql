-- Migration: Add subject_id foreign keys to notes, decks, and quizzes
-- Purpose: Link study materials to specific knowledge paths (subjects)
-- This enables the subject-centric refactoring with subject-specific resources

-- Add subject_id to notes table (if column doesn't exist)
DO $$ BEGIN
  ALTER TABLE notes 
  ADD COLUMN subject_id UUID REFERENCES knowledge_paths(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON notes(subject_id);

-- Add subject_id to decks table (if column doesn't exist)
DO $$ BEGIN
  ALTER TABLE decks
  ADD COLUMN subject_id UUID REFERENCES knowledge_paths(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_decks_subject_id ON decks(subject_id);

-- Add subject_id to quizzes table (if it exists and column doesn't exist)
DO $$ BEGIN
  ALTER TABLE quizzes
  ADD COLUMN subject_id UUID REFERENCES knowledge_paths(id) ON DELETE SET NULL
  DEFAULT NULL;
EXCEPTION
  WHEN undefined_table THEN
    NULL;  -- quizzes table doesn't exist yet, will be created in next migration
  WHEN duplicate_column THEN
    NULL;  -- column already exists
END $$;

-- Create index for faster queries (only if quizzes table exists)
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON quizzes(subject_id);

-- Add RLS policies for subject-scoped content (if they don't already exist)
DO $$ BEGIN
  CREATE POLICY "Users can view their own subject notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;  -- policy already exists
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view their own subject decks" ON decks
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Only create policy for quizzes if table exists
DO $$ BEGIN
  CREATE POLICY "Users can view their own subject quizzes" ON quizzes
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
  WHEN undefined_table THEN
    NULL;  -- quizzes table doesn't exist yet
  WHEN duplicate_object THEN
    NULL;  -- policy already exists
END $$;

-- Create view for subject-specific content (optional helper view)
-- DROP VIEW IF EXISTS subject_content;  -- Uncomment if you need to refresh the view
CREATE OR REPLACE VIEW subject_content AS
SELECT 
  kp.id as subject_id,
  kp.user_id,
  kp.name as subject_name,
  COUNT(DISTINCT n.id) as note_count,
  COUNT(DISTINCT d.id) as deck_count,
  COUNT(DISTINCT q.id) as quiz_count
FROM knowledge_paths kp
LEFT JOIN notes n ON n.subject_id = kp.id
LEFT JOIN decks d ON d.subject_id = kp.id
LEFT JOIN quizzes q ON q.subject_id = kp.id
GROUP BY kp.id, kp.user_id, kp.name;
