-- Migration: Create Daily Quests table
-- Supports the Daily Quests & Challenges feature (Phase 6)

CREATE TABLE IF NOT EXISTS public.daily_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL DEFAULT 'focus', -- 'focus', 'flashcard', 'quiz', 'writing', 'boss'
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  target_value INTEGER NOT NULL DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  gold_reward INTEGER NOT NULL DEFAULT 10,
  period TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  is_completed BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 day')
);

-- RLS Policies
ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quests"
  ON public.daily_quests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quests"
  ON public.daily_quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quests"
  ON public.daily_quests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quests"
  ON public.daily_quests FOR DELETE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_daily_quests_user_id ON public.daily_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_expires ON public.daily_quests(expires_at);
