-- Migration 003_v12.sql — FAM v1.2: Spouses table, stubs, approval scopes, social fields, avatar versioning
-- Idempotent for MySQL 8.0 / MariaDB 10.6+
-- Run: mysql -u root -p family_tree < db/migrations/003_v12.sql

-- ============================================================
-- 1. Add new columns to members (idempotent)
-- ============================================================

SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'members'
                  AND COLUMN_NAME = 'is_stub');
SET @sqlstmt = IF(@exist = 0,
                  'ALTER TABLE members ADD COLUMN is_stub TINYINT(1) DEFAULT 0 AFTER company',
                  'SELECT "is_stub already exists" as status');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'members'
                  AND COLUMN_NAME = 'claimed_by_user_id');
SET @sqlstmt = IF(@exist = 0,
                  'ALTER TABLE members ADD COLUMN claimed_by_user_id INT NULL AFTER is_stub',
                  'SELECT "claimed_by_user_id already exists" as status');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'members'
                  AND COLUMN_NAME = 'added_by_member_id');
SET @sqlstmt = IF(@exist = 0,
                  'ALTER TABLE members ADD COLUMN added_by_member_id INT NULL AFTER claimed_by_user_id',
                  'SELECT "added_by_member_id already exists" as status');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'members'
                  AND COLUMN_NAME = 'avatar_version');
SET @sqlstmt = IF(@exist = 0,
                  'ALTER TABLE members ADD COLUMN avatar_version INT DEFAULT 0 AFTER added_by_member_id',
                  'SELECT "avatar_version already exists" as status');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'members'
                  AND COLUMN_NAME = 'facebook');
SET @sqlstmt = IF(@exist = 0,
                  'ALTER TABLE members ADD COLUMN facebook VARCHAR(255) NULL AFTER twitter',
                  'SELECT "facebook already exists" as status');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'members'
                  AND COLUMN_NAME = 'youtube');
SET @sqlstmt = IF(@exist = 0,
                  'ALTER TABLE members ADD COLUMN youtube VARCHAR(255) NULL AFTER facebook',
                  'SELECT "youtube already exists" as status');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 2. Create spouses table (symmetric marriage records)
-- ============================================================

CREATE TABLE IF NOT EXISTS spouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_a_id INT NOT NULL,
    member_b_id INT NOT NULL,
    status ENUM('current', 'former', 'late') DEFAULT 'current',
    since DATE NULL,
    until DATE NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_spouses_a (member_a_id),
    INDEX idx_spouses_b (member_b_id),
    CONSTRAINT chk_spouses_order CHECK (member_a_id < member_b_id)
);

-- Migrate existing spouse_id into spouses table (one-time, idempotent via IGNORE)
INSERT IGNORE INTO spouses (member_a_id, member_b_id, status, created_at)
SELECT m1.id, m1.spouse_id, 'current', m1.created_at
FROM members m1
WHERE m1.spouse_id IS NOT NULL AND m1.id < m1.spouse_id;

-- ============================================================
-- 3. Create approval_scopes table (editor subtree delegation)
-- ============================================================

CREATE TABLE IF NOT EXISTS approval_scopes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    root_member_id INT NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_approval_scope (user_id, root_member_id),
    INDEX idx_approval_scope_user (user_id),
    INDEX idx_approval_scope_root (root_member_id)
);

-- ============================================================
-- 4. Add can_approve to users
-- ============================================================

SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'users'
                  AND COLUMN_NAME = 'can_approve');
SET @sqlstmt = IF(@exist = 0,
                  'ALTER TABLE users ADD COLUMN can_approve TINYINT(1) DEFAULT 0 AFTER status',
                  'SELECT "can_approve already exists" as status');
PREPARE stmt FROM @sqlstmt; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 5. Add missing indexes (idempotent via DROP IF EXISTS → CREATE)
-- ============================================================

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members' AND INDEX_NAME = 'idx_members_mobile') = 0,
  'CREATE INDEX idx_members_mobile ON members(mobile_number)',
  'SELECT "idx_members_mobile exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members' AND INDEX_NAME = 'idx_members_is_stub') = 0,
  'CREATE INDEX idx_members_is_stub ON members(is_stub)',
  'SELECT "idx_members_is_stub exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members' AND INDEX_NAME = 'idx_members_father') = 0,
  'CREATE INDEX idx_members_father ON members(father_id)',
  'SELECT "idx_members_father exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'members' AND INDEX_NAME = 'idx_members_mother') = 0,
  'CREATE INDEX idx_members_mother ON members(mother_id)',
  'SELECT "idx_members_mother exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- 6. Status enum expansion (MySQL enums are tricky; just ensure compatibility)
-- ============================================================
-- Note: MySQL ALTER ENUM requires full re-declaration. Since the app layer
-- enforces 'approved' concept (auto-approved = status='active'), we keep
-- the existing enum('pending','active','inactive') and use 'active' for approved.

SELECT 'Migration 003_v12 completed successfully' as status;
