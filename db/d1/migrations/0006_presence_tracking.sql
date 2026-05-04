-- D1 Migration 0006: Presence tracking
-- Run: wrangler d1 execute eriyaden --file=db/d1/migrations/0006_presence_tracking.sql

ALTER TABLE users ADD COLUMN last_seen TEXT NULL;
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Update existing rows to have current timestamp
UPDATE users SET last_seen = datetime('now') WHERE status = 'active';
