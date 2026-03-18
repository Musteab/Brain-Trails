-- Migration: Create Quizzes and Quiz Attempts tables
-- Supports the Quiz Creator feature (Phase 3)

-- 1. Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Quiz',
  source_type TEXT NOT NULL DEFAULT 'manual', -- 'note', 'deck', 'manual'
  source_id UUID, -- optional reference to notes.id or flashcard_decks.id
  difficulty TEXT NOT NULL DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  questions JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Quiz Attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]'::JSONB,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  gold_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RLS Policies for quizzes
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quizzes"
  ON public.quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quizzes"
  ON public.quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes"
  ON public.quizzes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quizzes"
  ON public.quizzes FOR DELETE
  USING (auth.uid() = user_id);

-- 4. RLS Policies for quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
