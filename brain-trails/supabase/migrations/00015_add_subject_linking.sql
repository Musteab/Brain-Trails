-- Migration: Add subject_id foreign keys to notes, decks, and quizzes
-- Purpose: Link study materials to specific knowledge paths (subjects)
-- This enables the subject-centric refactoring with subject-specific resources

-- Add subject_id to notes table
ALTER TABLE notes 
ADD COLUMN subject_id UUID REFERENCES knowledge_paths(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON notes(subject_id);

-- Add subject_id to decks table  
ALTER TABLE decks
ADD COLUMN subject_id UUID REFERENCES knowledge_paths(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_decks_subject_id ON decks(subject_id);

-- Add subject_id to quizzes table (if it exists)
ALTER TABLE quizzes
ADD COLUMN subject_id UUID REFERENCES knowledge_paths(id) ON DELETE SET NULL
DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON quizzes(subject_id);

-- Add RLS policy for notes with subject filtering
CREATE POLICY "Users can view their own subject notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

-- Add RLS policy for decks with subject filtering
CREATE POLICY "Users can view their own subject decks" ON decks
  FOR SELECT USING (auth.uid() = user_id);

-- Add RLS policy for quizzes with subject filtering
CREATE POLICY "Users can view their own subject quizzes" ON quizzes
  FOR SELECT USING (auth.uid() = user_id);

-- Create view for subject-specific content (optional helper view)
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
