-- Migration: Final polish — roles, titles, beta cosmetics, support tickets
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════
-- 1. Ensure notes.content_html is TEXT with default
-- ═══════════════════════════════════════════════
ALTER TABLE notes ALTER COLUMN content_html TYPE text;
ALTER TABLE notes ALTER COLUMN content_html SET DEFAULT '';

-- ═══════════════════════════════════════════════
-- 2. Expand profiles.role to include dev & beta_tester
-- ═══════════════════════════════════════════════
-- Drop existing CHECK constraint (name may vary — try common patterns)
DO $$ BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'guild_leader', 'admin', 'dev', 'beta_tester'));

-- ═══════════════════════════════════════════════
-- 3. Add title, title_border, beta_joined_at columns
-- ═══════════════════════════════════════════════
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title_border text DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_joined_at timestamptz DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_frame text DEFAULT 'default';

-- ═══════════════════════════════════════════════
-- 4. Enforce unique username (already exists, but safe re-add)
-- ═══════════════════════════════════════════════
-- profiles.username already has UNIQUE from migration 00001 — no action needed

-- ═══════════════════════════════════════════════
-- 5. Insert special dev & beta tester cosmetics
-- ═══════════════════════════════════════════════
INSERT INTO cosmetics (id, name, description, category, rarity, gold_cost, level_required)
VALUES
  (gen_random_uuid(), 'Realm Arch-Mage Frame', 'A legendary frame for the creator of Brain Trails', 'avatar_frame', 'legendary', 0, 1),
  (gen_random_uuid(), 'Beta Pioneer Frame', 'Exclusive frame for beta testers — only available in the first month', 'avatar_frame', 'epic', 0, 1),
  (gen_random_uuid(), 'Dev''s Arcane Title', 'The title of the realm''s architect', 'title', 'legendary', 0, 1),
  (gen_random_uuid(), 'Beta Trailblazer Title', 'For those who walked the trails first', 'title', 'epic', 0, 1)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════
-- 6. Create support_tickets table
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('bug', 'feature', 'question', 'other')),
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  page_url TEXT DEFAULT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_response TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create tickets
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all tickets (check profile role)
CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dev')
    )
  );

-- Admins can update any ticket (respond, change status)
CREATE POLICY "Admins can update tickets"
  ON support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dev')
    )
  );
