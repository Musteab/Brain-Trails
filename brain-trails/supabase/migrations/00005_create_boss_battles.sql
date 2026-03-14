-- Migration: Create boss_battles table
-- Tracks boss battle results (flashcard-powered combat)

CREATE TABLE IF NOT EXISTS boss_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  boss_id TEXT NOT NULL,
  deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
  result TEXT NOT NULL CHECK (result IN ('victory', 'defeat')),
  damage_dealt INTEGER DEFAULT 0,
  cards_answered INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  gold_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE boss_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own battles" ON boss_battles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own battles" ON boss_battles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_boss_battles_user ON boss_battles(user_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_date ON boss_battles(completed_at);
