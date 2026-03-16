-- ============================================
-- Study Subjects System (Phase 3)
-- Centralized subject/course management with
-- exam scheduling and AI syllabus parsing.
-- ============================================

-- Semesters / academic periods
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                          -- e.g. "Fall 2026", "Year 2"
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects (courses)
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
  name TEXT NOT NULL,                          -- e.g. "Physics 201"
  code TEXT DEFAULT '',                        -- e.g. "PHYS201"
  emoji TEXT DEFAULT '',
  color TEXT DEFAULT 'from-violet-500 to-purple-600',
  description TEXT DEFAULT '',
  professor TEXT DEFAULT '',
  credit_hours INTEGER DEFAULT 3,
  target_grade TEXT DEFAULT '',                -- e.g. "A", "90%"
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics within a subject
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                          -- e.g. "Thermodynamics"
  description TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  mastery_pct INTEGER DEFAULT 0 CHECK (mastery_pct >= 0 AND mastery_pct <= 100),
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exams and deadlines
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,                          -- e.g. "Midterm 1", "Final Exam"
  exam_type TEXT DEFAULT 'exam' CHECK (exam_type IN ('exam', 'quiz', 'assignment', 'project', 'presentation', 'other')),
  exam_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,                    -- how long the exam is
  location TEXT DEFAULT '',
  weight_pct FLOAT DEFAULT 0,                  -- percentage of final grade
  notes TEXT DEFAULT '',
  -- Reminder / cram config
  reminder_24h BOOLEAN DEFAULT true,
  reminder_48h BOOLEAN DEFAULT true,
  reminder_1week BOOLEAN DEFAULT true,
  cram_mode_enabled BOOLEAN DEFAULT true,      -- auto-activate cram for this exam
  -- Post-exam
  score FLOAT,                                 -- actual score (filled after)
  max_score FLOAT DEFAULT 100,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link topics to exams (which topics does this exam cover?)
CREATE TABLE IF NOT EXISTS exam_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(exam_id, topic_id)
);

-- Add onboarding_completed to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add optional subject_id to existing tables for linking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='decks' AND column_name='subject_id'
  ) THEN
    ALTER TABLE decks ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='notes' AND column_name='subject_id'
  ) THEN
    ALTER TABLE notes ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='focus_sessions' AND column_name='subject_id'
  ) THEN
    ALTER TABLE focus_sessions ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_topics ENABLE ROW LEVEL SECURITY;

-- Semesters
DROP POLICY IF EXISTS "Users can view own semesters" ON semesters;
DROP POLICY IF EXISTS "Users can insert own semesters" ON semesters;
DROP POLICY IF EXISTS "Users can update own semesters" ON semesters;
DROP POLICY IF EXISTS "Users can delete own semesters" ON semesters;
CREATE POLICY "Users can view own semesters" ON semesters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own semesters" ON semesters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own semesters" ON semesters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own semesters" ON semesters FOR DELETE USING (auth.uid() = user_id);

-- Subjects
DROP POLICY IF EXISTS "Users can view own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can insert own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can update own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can delete own subjects" ON subjects;
CREATE POLICY "Users can view own subjects" ON subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subjects" ON subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subjects" ON subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subjects" ON subjects FOR DELETE USING (auth.uid() = user_id);

-- Topics (access via subject ownership)
DROP POLICY IF EXISTS "Users can view own topics" ON topics;
DROP POLICY IF EXISTS "Users can insert own topics" ON topics;
DROP POLICY IF EXISTS "Users can update own topics" ON topics;
DROP POLICY IF EXISTS "Users can delete own topics" ON topics;
CREATE POLICY "Users can view own topics" ON topics FOR SELECT
  USING (subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own topics" ON topics FOR INSERT
  WITH CHECK (subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own topics" ON topics FOR UPDATE
  USING (subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own topics" ON topics FOR DELETE
  USING (subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid()));

-- Exams (access via subject ownership)
DROP POLICY IF EXISTS "Users can view own exams" ON exams;
DROP POLICY IF EXISTS "Users can insert own exams" ON exams;
DROP POLICY IF EXISTS "Users can update own exams" ON exams;
DROP POLICY IF EXISTS "Users can delete own exams" ON exams;
CREATE POLICY "Users can view own exams" ON exams FOR SELECT
  USING (subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own exams" ON exams FOR INSERT
  WITH CHECK (subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own exams" ON exams FOR UPDATE
  USING (subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own exams" ON exams FOR DELETE
  USING (subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid()));

-- Exam topics (access via exam -> subject ownership)
DROP POLICY IF EXISTS "Users can view own exam_topics" ON exam_topics;
DROP POLICY IF EXISTS "Users can insert own exam_topics" ON exam_topics;
DROP POLICY IF EXISTS "Users can delete own exam_topics" ON exam_topics;
CREATE POLICY "Users can view own exam_topics" ON exam_topics FOR SELECT
  USING (exam_id IN (SELECT id FROM exams WHERE subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid())));
CREATE POLICY "Users can insert own exam_topics" ON exam_topics FOR INSERT
  WITH CHECK (exam_id IN (SELECT id FROM exams WHERE subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid())));
CREATE POLICY "Users can delete own exam_topics" ON exam_topics FOR DELETE
  USING (exam_id IN (SELECT id FROM exams WHERE subject_id IN (SELECT id FROM subjects WHERE user_id = auth.uid())));

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_semesters_user ON semesters(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_topics_exam ON exam_topics(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_topics_topic ON exam_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_decks_subject ON decks(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject ON notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_subject_id ON focus_sessions(subject_id);
