-- Add per-user permission overrides (JSONB, nullable; used by admin permissions panel)
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions_override JSONB;
