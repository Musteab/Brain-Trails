-- Atomic increment functions to prevent race conditions

CREATE OR REPLACE FUNCTION increment_stats(user_id uuid, xp_amount int, gold_amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    xp = xp + xp_amount,
    level = GREATEST(1, FLOOR((xp + xp_amount) / 1000) + 1),
    gold = gold + gold_amount
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_xp(user_id uuid, xp_amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    xp = xp + xp_amount,
    level = GREATEST(1, FLOOR((xp + xp_amount) / 1000) + 1)
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_gold(user_id uuid, gold_amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET gold = gold + gold_amount
  WHERE id = user_id;
END;
$$;