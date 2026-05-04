-- Migration 0008: persist relationType chosen at signup so admin approval can branch on it
-- Run: mysql -u root -p family_tree < db/migrations/0008_user_relation_type.sql

-- ─── Add relation_type column to users ──────────────────────────────────────────
SET @rt = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'users'
             AND COLUMN_NAME = 'relation_type');
SET @sql_rt = IF(@rt = 0,
  "ALTER TABLE users ADD COLUMN relation_type ENUM('child','spouse','sibling') NULL AFTER secondary_ancestor_id",
  'SELECT "relation_type already exists" as status');
PREPARE stmt FROM @sql_rt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Index for admin dashboards filtering by relation_type ──────────────────────
SET @ix = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'users'
             AND INDEX_NAME = 'idx_users_relation_type');
SET @sql_ix = IF(@ix = 0,
  'CREATE INDEX idx_users_relation_type ON users (relation_type)',
  'SELECT "idx_users_relation_type already exists" as status');
PREPARE stmt FROM @sql_ix; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration 0008_user_relation_type completed' as status;
