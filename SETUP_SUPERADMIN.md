# Setup Superadmin for Supabase Migration

This guide will help you create a superadmin user for your Supabase instance during the migration from MySQL.

## Overview

The superadmin account will have full access to the family tree application and can manage users, permissions, and all data.

## Superadmin Details

- **Email**: `eriyadanplus@gmail.com`
- **Password**: *(set securely — do not commit plaintext passwords)*
- **Name**: `Muhamed Aboo Jabir`
- **Role**: `super_admin`
- **Generation**: 3 (can be updated later via admin panel)

## Setup Steps

### 1. Apply the Supabase Schema

First, ensure your Supabase instance has the correct schema structure. Run the schema file in your Supabase SQL Editor:

```sql
-- Run db/supabase/schema.sql in Supabase SQL Editor
```

### 2. Apply Secure RLS Policies

Replace the default permissive RLS policies with secure role-based access control:

```sql
-- Run db/supabase/secure-rpols.sql in Supabase SQL Editor
```

### 3. Create the Superadmin User

Run the seed script to create the superadmin user and associated records:

```sql
-- Run db/supabase/seed.sql in Supabase SQL Editor
```

### 4. Verify the Setup

After running the seed script, verify that the superadmin was created correctly by running the verification query in the seed file.

## Files Created

### `db/supabase/seed.sql`
Contains the SQL script to create:
- Superadmin user record with hashed password
- Corresponding member record
- Permissions record with full access
- Audit log entry

### `db/supabase/secure-rpols.sql`
Contains secure Row Level Security policies:
- Role-based access control
- Proper separation of permissions
- Restrictive policies for authenticated users only

### `scripts/generate-superadmin-hash.js`
Utility script to generate password hash (already run, hash is embedded in seed.sql).

## Testing the Superadmin Account

### 1. Login Testing
- Navigate to your application login page
- Use credentials: `eriyadanplus@gmail.com` / *(your password)*
- Verify you can successfully login

### 2. Admin Panel Access
- After login, navigate to the admin panel
- Verify you can access all admin functions
- Test user management capabilities

### 3. Profile Update
- Update your profile information
- Add location, bio, and other personal details
- Verify the generation number can be adjusted via admin panel

### 4. Lineage Connection
- Use the admin panel's lineage selector function
- Connect your ancestors properly
- Verify the family tree structure is correct

## Security Notes

- The password is securely hashed using SHA-256
- RLS policies ensure proper access control
- Only authenticated users can access the application
- Superadmin has full access to all functions

## Post-Setup Tasks

1. **Update Profile**: Complete your profile information after login
2. **Set Up Environment Variables**: Ensure your `.env` file has Supabase credentials
3. **Test Application**: Verify all functionality works correctly
4. **User Management**: Use the admin panel to add other users and assign roles

## Troubleshooting

### Issues with Seed Script
If the seed script fails:
1. Check that the schema was applied first
2. Verify no existing user with the same email exists
3. Check RLS policies aren't blocking the insert operations

### Login Issues
If login fails:
1. Verify the password hash is correct
2. Check the user status is 'active'
3. Verify the JWT token creation works

### Permission Issues
If access is denied:
1. Ensure secure RLS policies are applied
2. Verify user role is set correctly
3. Check the JWT token contains the role information

## Next Steps

1. Deploy the updated application with Supabase integration
2. Test all features with the superadmin account
3. Begin adding users and family tree data
4. Set up proper backup and monitoring

## Important Notes

- Change your password immediately after first login in production
- All other user management should be done through the admin panel
- The generation number can be adjusted as needed via the admin interface
- Audit logs will track all superadmin actions for security monitoring