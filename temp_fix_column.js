const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  'https://imjtbpwxtnqwvntntgmk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltanRicHd4dG5xd3ZudG50Z21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg3NDE1NSwiZXhwIjoyMDkzNDUwMTU1fQ.gusg2pIYcBBGTEZ91Dpq3ekDSW6aqr7sJUaAm5JBKhM'
);

async function fixColumn() {
  console.log('Renaming password column to password_hash...\n');

  // Rename password to password_hash
  const { data: renameResult, error: renameError } = await client.rpc('run_sql', {
    _sql: "ALTER TABLE users RENAME COLUMN password TO password_hash"
  });

  console.log('Rename result:', JSON.stringify({ data: renameResult, error: renameError }));

  // Verify the change
  console.log('\nVerifying columns...');
  const { data: cols, error: colsError } = await client.rpc('run_sql', {
    _sql: "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public' ORDER BY ordinal_position"
  });
  console.log('Current columns:', JSON.stringify(cols));

  // Test INSERT with correct column name
  console.log('\nTesting INSERT with password_hash column...');
  const testEmail = `test_${Date.now()}@example.com`;
  const { data: insertResult, error: insertError } = await client.rpc('run_sql', {
    _sql: `INSERT INTO users (email, name, password_hash, role, status) VALUES (?, ?, ?, ?, ?) RETURNING id`,
    _params: [testEmail, 'Test User', 'hashedpassword123', 'viewer', 'pending']
  });
  console.log('INSERT result:', JSON.stringify({ data: insertResult, error: insertError }));

  console.log('\n=== Fix Complete ===');
}

fixColumn().catch(console.error);