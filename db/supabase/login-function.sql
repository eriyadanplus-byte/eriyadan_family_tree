-- Run this in the Supabase SQL Editor once.
-- Creates a SECURITY DEFINER function so the anon role can authenticate
-- without needing direct table access (RLS is bypassed inside the function,
-- but the function itself controls what data is exposed).

CREATE OR REPLACE FUNCTION authenticate_user(p_email text)
RETURNS TABLE(
  id          uuid,
  email       text,
  password_hash text,
  role        text,
  status      text,
  member_id   uuid,
  can_approve boolean,
  name        text,
  last_seen   timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, password_hash, role, status, member_id, can_approve, name, last_seen
  FROM   users
  WHERE  users.email = p_email
  LIMIT  1;
$$;

-- Allow the anon (unauthenticated) role to call this function
GRANT EXECUTE ON FUNCTION authenticate_user(text) TO anon;

-- Update last_seen after successful login (also needs to bypass RLS for anon)
CREATE OR REPLACE FUNCTION update_last_seen(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE users SET last_seen = NOW() WHERE id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION update_last_seen(uuid) TO anon;

