-- Migration: Auto-migrate existing notes/decks/quizzes to "General" subject
-- Purpose: Link all existing (orphaned) notes, decks, and quizzes to a user-specific "General" subject
-- This ensures backward compatibility while supporting subject-centric learning
-- Timeline: One-time migration that runs on each user's first login post-migration

-- Step 1: Ensure subject_id column exists on quizzes table (in case migration #15 was skipped)
DO $$ BEGIN
  ALTER TABLE public.quizzes
  ADD COLUMN subject_id UUID REFERENCES knowledge_paths(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_column THEN
    NULL;  -- column already exists
  WHEN undefined_table THEN
    NULL;  -- quizzes table doesn't exist (shouldn't happen)
END $$;

-- Step 2: Create index on quizzes.subject_id
CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON public.quizzes(subject_id);

-- Step 3: For each user, auto-assign orphaned notes to their "General" subject
-- Only for users who have notes without a subject_id
WITH user_general_subjects AS (
  SELECT user_id, id as subject_id
  FROM knowledge_paths
  WHERE name = 'General'
)
UPDATE public.notes n
SET subject_id = ugs.subject_id, updated_at = NOW()
FROM user_general_subjects ugs
WHERE n.user_id = ugs.user_id 
  AND n.subject_id IS NULL;

-- Step 4: For each user, auto-assign orphaned decks to their "General" subject
WITH user_general_subjects AS (
  SELECT user_id, id as subject_id
  FROM knowledge_paths
  WHERE name = 'General'
)
UPDATE public.decks d
SET subject_id = ugs.subject_id
FROM user_general_subjects ugs
WHERE d.user_id = ugs.user_id 
  AND d.subject_id IS NULL;

-- Step 5: For each user, auto-assign orphaned quizzes to their "General" subject
WITH user_general_subjects AS (
  SELECT user_id, id as subject_id
  FROM knowledge_paths
  WHERE name = 'General'
)
UPDATE public.quizzes q
SET subject_id = ugs.subject_id, created_at = NOW()
FROM user_general_subjects ugs
WHERE q.user_id = ugs.user_id 
  AND q.subject_id IS NULL;

-- Step 6: Add comment for future reference
COMMENT ON COLUMN public.notes.subject_id IS 
'Foreign key to knowledge_paths. Links notes to specific subjects. Migrated orphaned notes to "General" subject.';

COMMENT ON COLUMN public.decks.subject_id IS 
'Foreign key to knowledge_paths. Links flashcard decks to specific subjects. Migrated orphaned decks to "General" subject.';

COMMENT ON COLUMN public.quizzes.subject_id IS 
'Foreign key to knowledge_paths. Links quizzes to specific subjects. Migrated orphaned quizzes to "General" subject.';
