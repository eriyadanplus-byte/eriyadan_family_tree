-- Migration 0007: Couple-paired signup + structured help/contact form fields
-- Run: mysql -u root -p family_tree < db/migrations/0007_signup_couples_and_help_form.sql

-- ─── Extend help_threads.trigger_stage ENUM to include 'contact_form' ───────
-- MySQL requires re-declaring the full ENUM when adding a value
SET @exist_cf = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'help_threads'
                 AND COLUMN_NAME = 'trigger_stage'
                 AND COLUMN_TYPE LIKE '%contact_form%');
SET @sql_ts = IF(@exist_cf = 0,
  "ALTER TABLE help_threads MODIFY COLUMN trigger_stage ENUM('signup_start','signup_final_no_match','contact_form') NOT NULL",
  'SELECT "trigger_stage already has contact_form" as status');
PREPARE stmt FROM @sql_ts; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Add inquiry_kind column ──────────────────────────────────────────────────
SET @ik = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'help_threads'
           AND COLUMN_NAME = 'inquiry_kind');
SET @sql_ik = IF(@ik = 0,
  "ALTER TABLE help_threads ADD COLUMN inquiry_kind ENUM('general','contact_form') NOT NULL DEFAULT 'general' AFTER trigger_stage",
  'SELECT "inquiry_kind already exists" as status');
PREPARE stmt FROM @sql_ik; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Add ancestor_name column ─────────────────────────────────────────────────
SET @an = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'help_threads'
           AND COLUMN_NAME = 'ancestor_name');
SET @sql_an = IF(@an = 0,
  'ALTER TABLE help_threads ADD COLUMN ancestor_name VARCHAR(255) NULL AFTER inquiry_kind',
  'SELECT "ancestor_name already exists" as status');
PREPARE stmt FROM @sql_an; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Add place column ────────────────────────────────────────────────────────
SET @pl = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'help_threads'
           AND COLUMN_NAME = 'place');
SET @sql_pl = IF(@pl = 0,
  'ALTER TABLE help_threads ADD COLUMN place VARCHAR(255) NULL AFTER ancestor_name',
  'SELECT "place already exists" as status');
PREPARE stmt FROM @sql_pl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Add contact_number column ────────────────────────────────────────────────
SET @cn = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'help_threads'
           AND COLUMN_NAME = 'contact_number');
SET @sql_cn = IF(@cn = 0,
  'ALTER TABLE help_threads ADD COLUMN contact_number VARCHAR(32) NULL AFTER place',
  'SELECT "contact_number already exists" as status');
PREPARE stmt FROM @sql_cn; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Add whatsapp_number column ───────────────────────────────────────────────
SET @wn = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'help_threads'
           AND COLUMN_NAME = 'whatsapp_number');
SET @sql_wn = IF(@wn = 0,
  'ALTER TABLE help_threads ADD COLUMN whatsapp_number VARCHAR(32) NULL AFTER contact_number',
  'SELECT "whatsapp_number already exists" as status');
PREPARE stmt FROM @sql_wn; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Add secondary_ancestor_id to users (stores second parent at signup) ─────
SET @sa = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'users'
           AND COLUMN_NAME = 'secondary_ancestor_id');
SET @sql_sa = IF(@sa = 0,
  'ALTER TABLE users ADD COLUMN secondary_ancestor_id INT NULL AFTER member_id',
  'SELECT "secondary_ancestor_id already exists" as status');
PREPARE stmt FROM @sql_sa; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Seed admin_help_alert_muted app_setting ─────────────────────────────────
INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES ('admin_help_alert_muted', '0');

SELECT 'Migration 0007_signup_couples_and_help_form completed' as status;
