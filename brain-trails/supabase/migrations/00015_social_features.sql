-- ============================================
-- Social Features Migration
-- Mana Boosts, Study Invites, Notifications
-- ============================================

-- Notifications table for real-time social features
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mana_boost', 'encouragement', 'study_invite', 'friend_request', 'guild_invite', 'achievement', 'system')),
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  xp_amount INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friends table (for future full friends system)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user_id, friend_id)
);

-- Study sessions for co-op studying
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  name TEXT DEFAULT 'Study Session',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_xp_earned INTEGER DEFAULT 0
);

-- Study session participants
CREATE TABLE IF NOT EXISTS study_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(session_id, user_id)
);

-- ============================================
-- RLS Policies
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_session_participants ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can only see their own
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications to others" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert notifications to others" ON notifications 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own notifications" ON notifications 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications 
  FOR DELETE USING (auth.uid() = user_id);

-- Friendships: Users can see friendships they're part of
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can insert friendships" ON friendships;
DROP POLICY IF EXISTS "Users can update own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;

CREATE POLICY "Users can view own friendships" ON friendships 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert friendships" ON friendships 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own friendships" ON friendships 
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete own friendships" ON friendships 
  FOR DELETE USING (auth.uid() = user_id);

-- Study sessions: Visible to participants
DROP POLICY IF EXISTS "Users can view study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can create study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Hosts can update study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Hosts can delete study sessions" ON study_sessions;

CREATE POLICY "Users can view study sessions" ON study_sessions 
  FOR SELECT USING (
    auth.uid() = host_id OR 
    id IN (SELECT session_id FROM study_session_participants WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create study sessions" ON study_sessions 
  FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update study sessions" ON study_sessions 
  FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete study sessions" ON study_sessions 
  FOR DELETE USING (auth.uid() = host_id);

-- Study session participants
DROP POLICY IF EXISTS "Users can view session participants" ON study_session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON study_session_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON study_session_participants;
DROP POLICY IF EXISTS "Users can leave sessions" ON study_session_participants;

CREATE POLICY "Users can view session participants" ON study_session_participants 
  FOR SELECT USING (
    session_id IN (SELECT id FROM study_sessions WHERE host_id = auth.uid()) OR
    user_id = auth.uid()
  );
CREATE POLICY "Users can join sessions" ON study_session_participants 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON study_session_participants 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave sessions" ON study_session_participants 
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_host ON study_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);
CREATE INDEX IF NOT EXISTS idx_study_session_participants_session ON study_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_study_session_participants_user ON study_session_participants(user_id);

-- ============================================
-- Realtime subscriptions
-- ============================================

-- Enable realtime for notifications (for live Mana Boost alerts)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- Helper function: Send Mana Boost
-- Awards XP to recipient and creates notification
-- ============================================

CREATE OR REPLACE FUNCTION send_mana_boost(
  sender_uuid UUID,
  recipient_uuid UUID,
  boost_xp INTEGER DEFAULT 25,
  boost_message TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
  sender_name TEXT;
BEGIN
  -- Get sender's display name
  SELECT display_name INTO sender_name FROM profiles WHERE id = sender_uuid;
  
  -- Award XP to recipient
  PERFORM increment_xp(recipient_uuid, boost_xp);
  
  -- Create notification
  INSERT INTO notifications (user_id, sender_id, type, title, message, xp_amount, metadata)
  VALUES (
    recipient_uuid,
    sender_uuid,
    'mana_boost',
    'Mana Boost!',
    COALESCE(NULLIF(boost_message, ''), sender_name || ' sent you magical energy!'),
    boost_xp,
    jsonb_build_object('sender_name', sender_name)
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_mana_boost TO authenticated;
