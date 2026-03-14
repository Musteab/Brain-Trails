-- ============================================
-- Brain Trails - Full Database Schema
-- Run this in Supabase SQL Editor for a fresh setup.
--
-- For incremental changes, see supabase/migrations/
-- which contains the same schema split into individual
-- migration files (one per table/feature).
-- ============================================

-- Users profile (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'guild_leader', 'admin')),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  gold INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  streak_last_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Focus timer sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INTEGER DEFAULT 0,
  gold_earned INTEGER DEFAULT 0
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Untitled',
  content_html TEXT DEFAULT '',
  folder TEXT DEFAULT 'root',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcard decks
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📚',
  color TEXT DEFAULT 'from-violet-500 to-purple-600',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards
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

-- Boss battle results
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

-- Adventure log (GitHub-style activity tracking)
CREATE TABLE IF NOT EXISTS adventure_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('focus', 'flashcard', 'note', 'quest', 'login')),
  xp_earned INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'moon' CHECK (theme IN ('sun', 'moon', 'auto')),
  accent_color TEXT DEFAULT 'purple',
  focus_duration INTEGER DEFAULT 25,
  break_duration INTEGER DEFAULT 5,
  sound_enabled BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE boss_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, edit only their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Focus sessions: users can only see/create their own
CREATE POLICY "Users can view own sessions" ON focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notes: users can only see/edit their own
CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- Decks: users can only see/edit their own
CREATE POLICY "Users can view own decks" ON decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decks" ON decks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own decks" ON decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own decks" ON decks FOR DELETE USING (auth.uid() = user_id);

-- Cards: users can manage cards in their own decks
CREATE POLICY "Users can view own cards" ON cards FOR SELECT
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own cards" ON cards FOR INSERT
  WITH CHECK (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own cards" ON cards FOR UPDATE
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own cards" ON cards FOR DELETE
  USING (deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid()));

-- Adventure log: users can see/create their own
CREATE POLICY "Users can view own log" ON adventure_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own log" ON adventure_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Settings: users can only manage their own
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Boss battles: users can view/create their own
CREATE POLICY "Users can view own battles" ON boss_battles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own battles" ON boss_battles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Trigger: auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', 'Traveler'),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_date ON focus_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_log_user ON adventure_log(user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_log_date ON adventure_log(created_at);
CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_user ON boss_battles(user_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_date ON boss_battles(completed_at);
