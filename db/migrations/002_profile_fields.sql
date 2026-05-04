-- Idempotent migration: Add current_role and company columns to members table
-- Run this after the initial schema (001_initial.sql) has been applied

USE eriyaden_legacy;

-- Add current_role column if it does not exist
SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                  WHERE TABLE_SCHEMA = 'eriyaden_legacy' 
                  AND TABLE_NAME = 'members' 
                  AND COLUMN_NAME = 'current_role');
SET @sqlstmt = IF(@exist = 0, 
                  'ALTER TABLE members ADD COLUMN current_role VARCHAR(120) NULL AFTER bio',
                  'SELECT "current_role column already exists" as status');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add company column if it does not exist
SET @exist = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                  WHERE TABLE_SCHEMA = 'eriyaden_legacy' 
                  AND TABLE_NAME = 'members' 
                  AND COLUMN_NAME = 'company');
SET @sqlstmt = IF(@exist = 0, 
                  'ALTER TABLE members ADD COLUMN company VARCHAR(120) NULL AFTER current_role',
                  'SELECT "company column already exists" as status');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verification
SELECT 'Migration 002 completed' as status;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'eriyaden_legacy' 
AND TABLE_NAME = 'members' 
AND COLUMN_NAME IN ('current_role', 'company');
