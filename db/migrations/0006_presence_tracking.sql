-- Migration 0006: Presence tracking for real-time online status
-- Run: mysql -u root -p family_tree < db/migrations/0006_presence_tracking.sql

SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = 'last_seen');
SET @sqlstmt = IF(@exist = 0,
              'ALTER TABLE users ADD COLUMN last_seen TIMESTAMP NULL AFTER can_approve',
              'SELECT "last_seen already exists" as status');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index for presence queries (idempotent)
SET @idx_exist = (SELECT COUNT(*) FROM information_schema.STATISTICS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' 
                  AND INDEX_NAME = 'idx_users_last_seen');
SET @sql = IF(@idx_exist = 0,
            'CREATE INDEX idx_users_last_seen ON users(last_seen)',
            'SELECT "idx_users_last_seen exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exist2 = (SELECT COUNT(*) FROM information_schema.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' 
                   AND INDEX_NAME = 'idx_users_status_last_seen');
SET @sql2 = IF(@idx_exist2 = 0,
             'CREATE INDEX idx_users_status_last_seen ON users(status, last_seen)',
             'SELECT "idx_users_status_last_seen exists"');
PREPARE stmt FROM @sql2; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT 'Migration 0006_presence_tracking completed' as status;
