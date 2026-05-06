# Fix Superadmin Generation

Run this in Supabase SQL Editor to check and fix the superadmin generation:

```sql
-- Check current state of members
SELECT id, full_name, generation, claimed_by_user_id FROM members;

-- Fix: Set superadmin (member with claimed_by_user_id) to generation 3
UPDATE members SET generation = 3 WHERE claimed_by_user_id IS NOT NULL;
```

Then refresh the page and the superadmin should appear as Gen 3.