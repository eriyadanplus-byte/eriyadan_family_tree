const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  'https://imjtbpwxtnqwvntntgmk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltanRicHd4dG5xd3ZudG50Z21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg3NDE1NSwiZXhwIjoyMDkzNDUwMTU1fQ.gusg2pIYcBBGTEZ91Dpq3ekDSW6aqr7sJUaAm5JBKhM'
);

async function testFullSignup() {
  console.log('=== Testing Full Signup Flow ===\n');

  const testEmail = `test_user_${Date.now()}@example.com`;
  const ancestorId = '00000000-0000-0000-0000-000000000001'; // Muhamed Aboo Jabir

  // Test 1: Signup with pending status (normal flow)
  console.log('1. Testing normal signup (pending)...');
  const { data: insert1, error: error1 } = await client.rpc('run_sql', {
    _sql: `INSERT INTO users (email, name, mobile_number, password_hash, role, status, member_id, secondary_ancestor_id, relation_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    _params: [testEmail, 'Test User', '+971501234567', 'hashed_pw_123', 'viewer', 'pending', ancestorId, null, 'child']
  });
  console.log('   Result:', JSON.stringify({ data: insert1, error: error1 }));

  if (error1) {
    console.log('\n!!! ERROR: Signup still failing !!!');
    console.log('Error details:', error1);
  } else {
    console.log('\n✓ Signup query works correctly!');
    console.log('Inserted user ID:', insert1[0]?.id);
  }

  // Clean up test user
  if (insert1 && insert1[0]) {
    await client.rpc('run_sql', {
      _sql: `DELETE FROM users WHERE id = ?`,
      _params: [insert1[0].id]
    });
    console.log('   (Test user cleaned up)');
  }

  console.log('\n=== Test Complete ===');
}

testFullSignup().catch(console.error);