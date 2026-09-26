-- Fix RLS policies for partner self-registration flow
-- Problem: anon/authenticated users couldn't SELECT unclaimed records or UPDATE user_id

-- 1. Allow ANYONE to read unclaimed partner records (needed for referral code validation at signup)
CREATE POLICY "Allow referral code validation"
  ON partners
  FOR SELECT
  USING (user_id IS NULL AND is_active = true);

-- 2. Allow authenticated users to CLAIM an unclaimed partner record (set their own user_id)
--    USING: the row being updated must be unclaimed (user_id IS NULL) and active
--    WITH CHECK: after update, user_id must equal the logged-in user
CREATE POLICY "Allow partner self registration claim"
  ON partners
  FOR UPDATE
  USING (user_id IS NULL AND is_active = true)
  WITH CHECK (auth.uid() = user_id);
