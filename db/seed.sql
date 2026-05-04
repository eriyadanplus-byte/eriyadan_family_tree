-- Seed script for Eriyadan's Legacy demo users
-- Run after database tables are initialized

-- Create root ancestor (needed to anchor other members)
INSERT INTO members (full_name, mobile_number, email, generation, is_late, gender, location, bio, created_by)
VALUES ('Eriyadan Ancestor', '+0000000000', 'ancestor@eriyaden.com', 1, false, 'male', 'Unknown', 'The root ancestor of the Eriyadan family tree.', 'system')
ON DUPLICATE KEY UPDATE id=id;

-- Seed demo users with bcrypt-hashed passwords (hash for 'demo123')
-- bcrypt hash of 'demo123' with 10 rounds: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO users (email, name, mobile_number, password, role, status, member_id)
VALUES ('admin@eriyaden.com', 'Admin User', '+1111111111', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 'active', 1)
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO users (email, name, mobile_number, password, role, status)
VALUES ('editor@eriyaden.com', 'Editor User', '+2222222222', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'editor', 'active')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO users (email, name, mobile_number, password, role, status)
VALUES ('viewer@eriyaden.com', 'Viewer User', '+3333333333', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viewer', 'active')
ON DUPLICATE KEY UPDATE id=id;
