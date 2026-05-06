-- Migration: Link superadmin user to member record
-- Fixes issue where admin panel shows gen1 instead of gen3
-- The seed.sql creates a member with generation: 3 via claimed_by_user_id
-- but does NOT set users.member_id, causing the session to have no linked member

-- Link the superadmin user to their member record via member_id
UPDATE users u
SET member_id = m.id
FROM members m
WHERE u.email = 'eriyadanplus@gmail.com'
  AND m.claimed_by_user_id = u.id
  AND m.deleted_at IS NULL;

-- Verify the link
SELECT
    u.id as user_id,
    u.email,
    u.member_id as linked_member_id,
    m.id as member_id,
    m.full_name,
    m.generation
FROM users u
LEFT JOIN members m ON m.id = u.member_id
WHERE u.email = 'eriyadanplus@gmail.com';