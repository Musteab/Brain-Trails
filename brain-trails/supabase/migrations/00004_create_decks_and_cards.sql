-- Migration: Create decks and cards tables
-- Flashcard (spell card) system with SM-2 inspired mastery tracking

CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📚',
  color TEXT DEFAULT 'from-violet-500 to-purple-600',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  mastery INTEGER DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
  next_review TIMESTAMPTZ DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Decks RLS
CREATE POLICY "Users can view own decks" ON decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decks" ON decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own decks" ON decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own decks" ON decks FOR DELETE USING (auth.uid() = user_id);

-- Cards RLS (through deck ownership)
CREATE POLICY "Users can view own cards" ON cards FOR SELECT
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own cards" ON cards FOR INSERT
  WITH CHECK (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own cards" ON cards FOR UPDATE
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own cards" ON cards FOR DELETE
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck_id);
