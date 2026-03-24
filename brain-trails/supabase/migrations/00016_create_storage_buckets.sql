-- ============================================
-- Storage Buckets for Avatars and Guild Emblems
-- ============================================

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- ============================================
-- Storage Policies
-- ============================================

-- Policy: Users can upload their own avatars and guild emblems
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (
    -- User uploading their own avatar
    (storage.foldername(name))[1] = 'avatars' AND
    auth.uid()::text = (storage.filename(name))::text
  ) OR (
    -- User uploading guild emblem (any authenticated user can upload guild emblems)
    (storage.foldername(name))[1] = 'guild-emblems'
  )
);

-- Policy: Anyone can view avatars (public bucket)
DROP POLICY IF EXISTS "Public access to avatars" ON storage.objects;
CREATE POLICY "Public access to avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Users can update their own avatars
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.filename(name))::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.filename(name))::text
);

-- Policy: Users can delete their own avatars
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  auth.uid()::text = (storage.filename(name))::text
);

-- Policy: Guild leaders can delete guild emblems
DROP POLICY IF EXISTS "Guild leaders can delete emblems" ON storage.objects;
CREATE POLICY "Guild leaders can delete emblems"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'guild-emblems' AND
  EXISTS (
    SELECT 1 FROM guild_members
    WHERE user_id = auth.uid()
    AND role = 'leader'
  )
);
