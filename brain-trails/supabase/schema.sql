-- ============================================
-- Brain Trails - Full Database Schema (v2)
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
  avatar_frame TEXT DEFAULT 'default',
  bio TEXT DEFAULT '',
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'guild_leader', 'admin')),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  gold INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  streak_last_date DATE,
  guild_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Focus timer sessions
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  mode TEXT DEFAULT 'normal' CHECK (mode IN ('normal', 'cram')),
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}'::TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  parent_folder_id UUID REFERENCES notes(id) ON DELETE CASCADE
);

-- Flashcard decks
CREATE TABLE IF NOT EXISTS decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '',
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
  activity_type TEXT NOT NULL CHECK (activity_type IN ('focus', 'flashcard', 'note', 'quest', 'login', 'boss', 'guild', 'achievement', 'streak')),
  xp_earned INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings (expanded)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  -- Appearance
  theme TEXT DEFAULT 'moon' CHECK (theme IN ('sun', 'moon', 'auto')),
  accent_color TEXT DEFAULT 'purple',
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  -- Focus
  focus_duration INTEGER DEFAULT 25,
  break_duration INTEGER DEFAULT 5,
  cram_mode_enabled BOOLEAN DEFAULT false,
  ambient_sound TEXT DEFAULT 'none' CHECK (ambient_sound IN ('none', 'rain', 'cafe', 'forest', 'lofi')),
  -- Audio
  sound_enabled BOOLEAN DEFAULT true,
  -- Notifications
  notifications_enabled BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  guild_notifications BOOLEAN DEFAULT true,
  study_nudges BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Knowledge Map (Arcane Archive / Skill Tree)
-- ============================================

-- Study paths (top-level subjects)
CREATE TABLE IF NOT EXISTS knowledge_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  emoji TEXT DEFAULT '',
  color TEXT DEFAULT 'from-purple-500 to-indigo-600',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nodes within a study path
CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID REFERENCES knowledge_paths(id) ON DELETE CASCADE NOT NULL,
  parent_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  node_type TEXT DEFAULT 'topic' CHECK (node_type IN ('topic', 'boss', 'checkpoint')),
  -- Unlock requirements
  required_focus_minutes INTEGER DEFAULT 0,
  required_card_reviews INTEGER DEFAULT 0,
  required_mastery_pct INTEGER DEFAULT 0,
  -- Progress tracking
  focus_minutes_logged INTEGER DEFAULT 0,
  card_reviews_logged INTEGER DEFAULT 0,
  mastery_pct INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  -- Boss node config (only for node_type='boss')
  boss_deck_id UUID REFERENCES decks(id) ON DELETE SET NULL,
  boss_hp INTEGER DEFAULT 100,
  -- Position on the visual map
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Guild System
-- ============================================

CREATE TABLE IF NOT EXISTS guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  emblem TEXT DEFAULT '',
  leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  max_members INTEGER DEFAULT 20,
  member_count INTEGER DEFAULT 1,
  weekly_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from profiles.guild_id to guilds (after guilds table exists)
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_guild
  FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'officer', 'leader')),
  weekly_xp INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS guild_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guild Boss Raids
CREATE TABLE IF NOT EXISTS guild_raids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  boss_hp INTEGER NOT NULL DEFAULT 500,
  current_hp INTEGER NOT NULL DEFAULT 500,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'victory', 'expired')),
  week_start DATE NOT NULL DEFAULT CURRENT_DATE,
  xp_reward INTEGER DEFAULT 500,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guild_raid_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raid_id UUID REFERENCES guild_raids(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  damage_dealt INTEGER DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  cards_reviewed INTEGER DEFAULT 0,
  contributed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Achievements System
-- ============================================

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('study', 'social', 'combat', 'exploration', 'streak')),
  xp_reward INTEGER DEFAULT 0,
  gold_reward INTEGER DEFAULT 0,
  -- Condition (evaluated in app code)
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL DEFAULT 1,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'))
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- Cosmetics / Themes Shop
-- ============================================

CREATE TABLE IF NOT EXISTS cosmetics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('theme', 'avatar_frame', 'title', 'background')),
  preview_data JSONB DEFAULT '{}',
  gold_cost INTEGER DEFAULT 0,
  level_required INTEGER DEFAULT 1,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'))
);

CREATE TABLE IF NOT EXISTS user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cosmetic_id TEXT REFERENCES cosmetics(id) ON DELETE CASCADE NOT NULL,
  equipped BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cosmetic_id)
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
ALTER TABLE knowledge_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_raids ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_raid_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;

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

-- Knowledge paths: users can only manage their own
CREATE POLICY "Users can view own paths" ON knowledge_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own paths" ON knowledge_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own paths" ON knowledge_paths FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own paths" ON knowledge_paths FOR DELETE USING (auth.uid() = user_id);

-- Knowledge nodes: users can manage nodes in their own paths
CREATE POLICY "Users can view own nodes" ON knowledge_nodes FOR SELECT
  USING (path_id IN (SELECT id FROM knowledge_paths WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own nodes" ON knowledge_nodes FOR INSERT
  WITH CHECK (path_id IN (SELECT id FROM knowledge_paths WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own nodes" ON knowledge_nodes FOR UPDATE
  USING (path_id IN (SELECT id FROM knowledge_paths WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own nodes" ON knowledge_nodes FOR DELETE
  USING (path_id IN (SELECT id FROM knowledge_paths WHERE user_id = auth.uid()));

-- Guilds: anyone can view guilds, members can update, leader can delete
CREATE POLICY "Guilds are viewable by everyone" ON guilds FOR SELECT USING (true);
CREATE POLICY "Anyone can create a guild" ON guilds FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leaders can update own guild" ON guilds FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "Leaders can delete own guild" ON guilds FOR DELETE USING (auth.uid() = leader_id);

-- Guild members: guild members can view, user can join/leave
CREATE POLICY "Guild members are viewable by guild members" ON guild_members FOR SELECT
  USING (guild_id IN (SELECT guild_id FROM guild_members gm WHERE gm.user_id = auth.uid()));
CREATE POLICY "Users can join guilds" ON guild_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave guilds" ON guild_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Leaders can manage members" ON guild_members FOR UPDATE
  USING (guild_id IN (SELECT id FROM guilds WHERE leader_id = auth.uid()));

-- Guild messages: guild members can view and send
CREATE POLICY "Members can view guild messages" ON guild_messages FOR SELECT
  USING (guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid()));
CREATE POLICY "Members can send guild messages" ON guild_messages FOR INSERT
  WITH CHECK (guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid()));

-- Guild raids: guild members can view, leaders can create
CREATE POLICY "Members can view raids" ON guild_raids FOR SELECT
  USING (guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid()));
CREATE POLICY "Leaders can create raids" ON guild_raids FOR INSERT
  WITH CHECK (guild_id IN (SELECT id FROM guilds WHERE leader_id = auth.uid()));
CREATE POLICY "System can update raids" ON guild_raids FOR UPDATE
  USING (guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid()));

-- Guild raid contributions
CREATE POLICY "Members can view contributions" ON guild_raid_contributions FOR SELECT
  USING (raid_id IN (SELECT id FROM guild_raids WHERE guild_id IN (SELECT guild_id FROM guild_members WHERE user_id = auth.uid())));
CREATE POLICY "Members can contribute" ON guild_raid_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Achievements: everyone can view definitions, users manage their own unlocks
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can view own achievement unlocks" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can unlock achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cosmetics: everyone can view shop, users manage their own purchases
CREATE POLICY "Cosmetics are viewable by everyone" ON cosmetics FOR SELECT USING (true);
CREATE POLICY "Users can view own cosmetics" ON user_cosmetics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can purchase cosmetics" ON user_cosmetics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can equip cosmetics" ON user_cosmetics FOR UPDATE USING (auth.uid() = user_id);

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
CREATE INDEX IF NOT EXISTS idx_knowledge_paths_user ON knowledge_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_path ON knowledge_nodes(path_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_parent ON knowledge_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_messages_guild ON guild_messages(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_messages_date ON guild_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_guild_raids_guild ON guild_raids(guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_raid_contribs_raid ON guild_raid_contributions(raid_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON user_cosmetics(user_id);

-- ============================================
-- Seed data: Achievements
-- ============================================

INSERT INTO achievements (id, name, description, icon, category, xp_reward, gold_reward, condition_type, condition_value, rarity) VALUES
  ('first_note', 'Scribe''s Beginning', 'Create your first note', 'scroll', 'study', 50, 10, 'notes_created', 1, 'common'),
  ('first_focus', 'First Spark', 'Complete your first focus session', 'flame', 'study', 50, 10, 'focus_sessions', 1, 'common'),
  ('focus_10', 'Dedicated Scholar', 'Complete 10 focus sessions', 'book-open', 'study', 200, 50, 'focus_sessions', 10, 'uncommon'),
  ('focus_100', 'Grand Arcanist', 'Complete 100 focus sessions', 'sparkles', 'study', 1000, 250, 'focus_sessions', 100, 'epic'),
  ('cards_100', 'Card Collector', 'Review 100 flashcards', 'layers', 'study', 200, 50, 'cards_reviewed', 100, 'uncommon'),
  ('cards_1000', 'Master of Cards', 'Review 1000 flashcards', 'crown', 'study', 1000, 250, 'cards_reviewed', 1000, 'epic'),
  ('streak_3', 'On a Roll', 'Maintain a 3-day study streak', 'zap', 'streak', 100, 25, 'streak_days', 3, 'common'),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day study streak', 'shield', 'streak', 300, 75, 'streak_days', 7, 'uncommon'),
  ('streak_30', 'Monthly Master', 'Maintain a 30-day study streak', 'trophy', 'streak', 1500, 500, 'streak_days', 30, 'rare'),
  ('streak_100', 'Legendary Dedication', 'Maintain a 100-day study streak', 'star', 'streak', 5000, 1500, 'streak_days', 100, 'legendary'),
  ('boss_first', 'Dragon Slayer', 'Defeat your first boss', 'sword', 'combat', 100, 25, 'bosses_defeated', 1, 'common'),
  ('boss_10', 'Boss Hunter', 'Defeat 10 bosses', 'swords', 'combat', 500, 150, 'bosses_defeated', 10, 'rare'),
  ('guild_founder', 'Guild Founder', 'Create a guild', 'flag', 'social', 200, 50, 'guilds_created', 1, 'uncommon'),
  ('guild_join', 'Fellowship', 'Join a guild', 'users', 'social', 50, 10, 'guilds_joined', 1, 'common'),
  ('raid_first', 'Raid Participant', 'Contribute to your first guild raid', 'target', 'social', 100, 25, 'raids_contributed', 1, 'common'),
  ('level_10', 'Rising Star', 'Reach level 10', 'trending-up', 'exploration', 500, 100, 'level_reached', 10, 'uncommon'),
  ('level_25', 'Seasoned Traveler', 'Reach level 25', 'compass', 'exploration', 1500, 400, 'level_reached', 25, 'rare'),
  ('level_50', 'Grand Master', 'Reach level 50', 'award', 'exploration', 5000, 1500, 'level_reached', 50, 'legendary'),
  ('hours_10', 'Focused Mind', 'Study for 10 total hours', 'clock', 'study', 300, 75, 'total_focus_hours', 10, 'uncommon'),
  ('hours_100', 'Century Scholar', 'Study for 100 total hours', 'hourglass', 'study', 3000, 1000, 'total_focus_hours', 100, 'legendary')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Seed data: Cosmetics Shop
-- ============================================

INSERT INTO cosmetics (id, name, description, category, gold_cost, level_required, rarity, preview_data) VALUES
  ('theme_forest', 'Enchanted Forest', 'A lush forest theme with green tones', 'theme', 500, 5, 'uncommon', '{"primary":"#2d5a27","secondary":"#4a7c3f","bg":"forest"}'),
  ('theme_ocean', 'Deep Ocean', 'A deep sea theme with blue tones', 'theme', 500, 5, 'uncommon', '{"primary":"#1a4a6e","secondary":"#2980b9","bg":"ocean"}'),
  ('theme_fire', 'Dragon Fire', 'A fiery red and orange theme', 'theme', 1000, 15, 'rare', '{"primary":"#c0392b","secondary":"#e74c3c","bg":"fire"}'),
  ('theme_cosmos', 'Cosmic Void', 'A dark space theme with nebula colors', 'theme', 2500, 25, 'epic', '{"primary":"#2c003e","secondary":"#7b2ff7","bg":"cosmos"}'),
  ('theme_gold', 'Golden Age', 'A luxurious gold and ivory theme', 'theme', 5000, 40, 'legendary', '{"primary":"#b8860b","secondary":"#ffd700","bg":"gold"}'),
  ('frame_bronze', 'Bronze Frame', 'A simple bronze avatar frame', 'avatar_frame', 200, 3, 'common', '{"border":"#cd7f32"}'),
  ('frame_silver', 'Silver Frame', 'A polished silver avatar frame', 'avatar_frame', 500, 10, 'uncommon', '{"border":"#c0c0c0"}'),
  ('frame_gold', 'Gold Frame', 'A gleaming gold avatar frame', 'avatar_frame', 1500, 20, 'rare', '{"border":"#ffd700"}'),
  ('frame_diamond', 'Diamond Frame', 'A sparkling diamond avatar frame', 'avatar_frame', 5000, 35, 'epic', '{"border":"#b9f2ff"}'),
  ('frame_legendary', 'Legendary Frame', 'An animated legendary avatar frame', 'avatar_frame', 10000, 50, 'legendary', '{"border":"#ff6b6b","animated":true}'),
  ('title_scholar', 'The Scholar', 'Display title: The Scholar', 'title', 100, 1, 'common', '{"text":"The Scholar"}'),
  ('title_mage', 'Arcane Mage', 'Display title: Arcane Mage', 'title', 300, 10, 'uncommon', '{"text":"Arcane Mage"}'),
  ('title_sage', 'Grand Sage', 'Display title: Grand Sage', 'title', 1000, 25, 'rare', '{"text":"Grand Sage"}'),
  ('title_legend', 'Living Legend', 'Display title: Living Legend', 'title', 5000, 50, 'legendary', '{"text":"Living Legend"}')
ON CONFLICT (id) DO NOTHING;
