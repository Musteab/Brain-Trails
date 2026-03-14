-- Migration: Create adventure_log table
-- GitHub-style activity tracking (contribution heatmap data source)

CREATE TABLE IF NOT EXISTS adventure_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('focus', 'flashcard', 'note', 'quest', 'login')),
  xp_earned INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE adventure_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own log" ON adventure_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own log" ON adventure_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_adventure_log_user ON adventure_log(user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_log_date ON adventure_log(created_at);
