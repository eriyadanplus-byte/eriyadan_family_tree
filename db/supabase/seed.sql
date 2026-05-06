-- Supabase Seed Data for Eriyadan's Legacy Family Tree
-- Run in Supabase SQL Editor after creating the schema

-- Insert superadmin user
INSERT INTO users (
    id,
    email,
    password_hash,
    name,
    role,
    status,
    can_approve,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'eriyadanplus@gmail.com',
    '6da537944b69b9c5882f1b50b14a4c0900cc1bdaf67eea18652536c6aee63fcc',
    'Muhamed Aboo Jabir',
    'super_admin',
    'active',
    true,
    NOW(),
    NOW()
) RETURNING id;

-- Store the user ID for creating the member and permissions records
DO $$
DECLARE
    superadmin_user_id UUID;
BEGIN
    -- Get the ID of the user we just inserted
    SELECT id INTO superadmin_user_id FROM users WHERE email = 'eriyadanplus@gmail.com';
    
    -- Insert corresponding member record
    INSERT INTO members (
        id,
        full_name,
        mobile_number,
        generation,
        claimed_by_user_id,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'Muhamed Aboo Jabir',
        NULL,
        3,
        superadmin_user_id,
        'system',
        NOW(),
        NOW()
    ) RETURNING id INTO superadmin_user_id;
    
    -- Insert permissions record for superadmin
    INSERT INTO permissions (
        id,
        user_id,
        can_add,
        can_edit,
        can_delete,
        can_export,
        scope,
        created_at
    ) VALUES (
        gen_random_uuid(),
        superadmin_user_id,
        true,
        true,
        true,
        true,
        'all',
        NOW()
    );
    
    -- Insert audit log entry for superadmin creation
    INSERT INTO audit_log (
        id,
        user_id,
        action,
        metadata,
        timestamp
    ) VALUES (
        gen_random_uuid(),
        superadmin_user_id,
        'CREATE_SUPERADMIN',
        jsonb_build_object(
            'email', 'eriyadanplus@gmail.com',
            'name', 'Muhamed Aboo Jabir',
            'role', 'super_admin'
        ),
        NOW()
    );
END $$;

-- Link the user to the member via member_id column (fixes gen display in admin panel)
UPDATE users u
SET member_id = m.id
FROM members m
WHERE u.email = 'eriyadanplus@gmail.com'
  AND m.claimed_by_user_id = u.id
  AND m.deleted_at IS NULL;

-- Verify the superadmin was created successfully
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    u.role,
    u.status,
    u.can_approve,
    m.id as member_id,
    m.full_name,
    m.generation,
    p.can_add,
    p.can_edit,
    p.can_delete,
    p.can_export,
    p.scope
FROM users u
LEFT JOIN members m ON u.id = m.claimed_by_user_id
LEFT JOIN permissions p ON u.id = p.user_id
WHERE u.email = 'eriyadanplus@gmail.com';