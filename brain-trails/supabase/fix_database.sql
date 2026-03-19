-- Fix 1: Add RLS policy for anonymous users to check username availability
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Fix 2: Improve handle_new_user trigger to handle collisions gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  new_username TEXT;
  counter INT := 1;
BEGIN
  -- Generate a base username
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    split_part(NEW.email, '@', 1), 
    'Traveler'
  );
  
  new_username := base_username;
  
  -- Loop until we find a unique username (case-insensitive check)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(new_username)) LOOP
    new_username := base_username || counter::TEXT;
    counter := counter + 1;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    new_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', new_username),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
