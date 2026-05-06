-- Migration: add current_role and company to members (Supabase)
-- current_role must be quoted — it is a PostgreSQL reserved keyword
ALTER TABLE members ADD COLUMN IF NOT EXISTS "current_role" TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS company TEXT;
