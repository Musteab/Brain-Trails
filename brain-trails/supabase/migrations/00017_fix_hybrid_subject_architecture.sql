-- Migration #17: Fix subject linking to support BOTH old and new architectures
-- Purpose: Allow hybrid system where both syllabus (subjects) and Arcane Archive (knowledge_paths) work together
-- 
-- CONTEXT: Migration #15 made an error - it changed the subject_id columns to point to knowledge_paths
-- instead of keeping them linked to the subjects table (old system).
-- This broke the AI flashcard generation which relies on subjects/topics from the syllabus.
--
-- SOLUTION: Support BOTH architectures:
-- - subject_id → subjects table (old syllabus system, existing code)
-- - knowledge_path_id → knowledge_paths table (new Arcane Archive system)

-- Step 1: Rename existing subject_id columns to avoid FK conflicts
-- (These were mistakenly set to knowledge_paths in migration #15)
DO $$ BEGIN
  ALTER TABLE notes RENAME COLUMN subject_id TO knowledge_path_id;
EXCEPTION
  WHEN undefined_column THEN
    NULL;  -- Column doesn't exist
  WHEN duplicate_column THEN
    NULL;  -- Column already renamed
END $$;

DO $$ BEGIN
  ALTER TABLE decks RENAME COLUMN subject_id TO knowledge_path_id;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
  WHEN duplicate_column THEN
    NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE quizzes RENAME COLUMN subject_id TO knowledge_path_id;
EXCEPTION
  WHEN undefined_column THEN
    NULL;
  WHEN duplicate_column THEN
    NULL;
END $$;

-- Step 2: Update indexes to use new column names
DROP INDEX IF EXISTS idx_notes_subject_id;
DROP INDEX IF EXISTS idx_decks_subject_id;
DROP INDEX IF EXISTS idx_quizzes_subject_id;

CREATE INDEX IF NOT EXISTS idx_notes_knowledge_path_id ON notes(knowledge_path_id);
CREATE INDEX IF NOT EXISTS idx_decks_knowledge_path_id ON decks(knowledge_path_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_knowledge_path_id ON quizzes(knowledge_path_id);

-- Step 3: Add BACK the correct subject_id columns (for old syllabus system)
-- This links to the existing subjects table for AI generation and syllabus tracking
DO $$ BEGIN
  ALTER TABLE notes
  ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;  -- Column already exists
END $$;

DO $$ BEGIN
  ALTER TABLE decks
  ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE quizzes
  ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;
END $$;

-- Step 4: Create indexes for old subject_id (syllabus system)
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_decks_subject_id ON decks(subject_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON quizzes(subject_id);

-- Step 5: Migrate knowledge_path_id data to subject_id where possible
-- For users who migrated to Arcane Archive, link their General subject to syllabus
-- (This is optional - mainly for hybrid users)

-- Step 6: Ensure foreign key constraints are correct
-- Notes: can belong to EITHER a subject (old) OR knowledge_path (new)
-- Decks: can belong to EITHER a subject (old) OR knowledge_path (new)
-- Quizzes: can belong to EITHER a subject (old) OR knowledge_path (new)

-- Step 7: Add helpful comments
COMMENT ON COLUMN notes.subject_id IS 
'FK to subjects (old syllabus system). For notes created from syllabus-based workflows.';

COMMENT ON COLUMN notes.knowledge_path_id IS 
'FK to knowledge_paths (new Arcane Archive system). For notes in subject-centric learning.';

COMMENT ON COLUMN decks.subject_id IS 
'FK to subjects (old syllabus system). For decks AI-generated from syllabus topics.';

COMMENT ON COLUMN decks.knowledge_path_id IS 
'FK to knowledge_paths (new Arcane Archive system). For decks in subject-centric learning.';

COMMENT ON COLUMN quizzes.subject_id IS 
'FK to subjects (old syllabus system). For quizzes linked to syllabus subjects.';

COMMENT ON COLUMN quizzes.knowledge_path_id IS 
'FK to knowledge_paths (new Arcane Archive system). For quizzes in subject-centric learning.';

-- Step 8: Migration summary log
-- This migration fixes the hybrid architecture to support:
-- 1. OLD: Syllabus (semesters/subjects/topics) system with AI generation
-- 2. NEW: Arcane Archive (knowledge_paths/nodes) system for subject-centric learning
-- 3. BOTH: Users can use either or both systems simultaneously
