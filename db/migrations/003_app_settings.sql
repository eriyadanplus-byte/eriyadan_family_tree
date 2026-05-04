-- Migration 003: Create app_settings table for persistent configuration
-- Run after initial schema is applied

CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default values (idempotent: insert ignore)
INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES
    ('siteName', "Eriyadan's Legacy"),
    ('allowRegistration', 'true'),
    ('requireApproval', 'true'),
    ('notifications', 'false'),
    ('hideAncestralPrivacy', 'false');

SELECT 'Migration 003 completed' as status;
