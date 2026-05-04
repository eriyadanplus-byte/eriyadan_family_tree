-- D1 Migration 0007: Couple-paired signup + structured help/contact form fields
-- Run: wrangler d1 execute eriyaden --file=db/d1/migrations/0007_signup_couples_and_help_form.sql

-- SQLite does not support ENUM — use TEXT with CHECK constraints.
-- SQLite ALTER TABLE only supports ADD COLUMN (no MODIFY), so trigger_stage
-- CHECK is updated in the full schema only; existing D1 rows are unaffected.

ALTER TABLE help_threads ADD COLUMN inquiry_kind TEXT NOT NULL DEFAULT 'general'
  CHECK (inquiry_kind IN ('general','contact_form'));

ALTER TABLE help_threads ADD COLUMN ancestor_name TEXT NULL;
ALTER TABLE help_threads ADD COLUMN place TEXT NULL;
ALTER TABLE help_threads ADD COLUMN contact_number TEXT NULL;
ALTER TABLE help_threads ADD COLUMN whatsapp_number TEXT NULL;

-- Store second parent ID for couple-paired signups
ALTER TABLE users ADD COLUMN secondary_ancestor_id INTEGER NULL;

-- Seed admin alert mute preference
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('admin_help_alert_muted', '0');
