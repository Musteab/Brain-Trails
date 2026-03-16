-- Migration: Enhance Notes with Folders, Tags, and Pins
-- Adds columns to `notes` table for Notion-like features

-- 1. Add `tags` array
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

-- 2. Add `is_pinned` boolean flag
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- 3. Add `parent_folder_id` for nested folder structures (self-referencing or just folders table)
-- Instead of a separate folders table, we'll allow notes to act as folders, or we can use it just to group.
-- Actually, the prompt says "parent_folder_id UUID REFERENCES notes(id)", so folders are just notes with a specific type, or just nesting notes.
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS parent_folder_id UUID REFERENCES public.notes(id) ON DELETE CASCADE;

-- Also let's ensure RLS policies accommodate these new columns automatically since they belong to the `notes` table
-- (RLS is already configured for the whole table)