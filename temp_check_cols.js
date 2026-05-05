const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  'https://imjtbpwxtnqwvntntgmk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltanRicHd4dG5xd3ZudG50Z21rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzg3NDE1NSwiZXhwIjoyMDkzNDUwMTU1fQ.gusg2pIYcBBGTEZ91Dpq3ekDSW6aqr7sJUaAm5JBKhM'
);

async function checkColumns() {
  const { data, error } = await client.rpc('run_sql', {
    _sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Users table columns:');
  data.forEach(col => console.log(`  - ${col.column_name} (${col.data_type})`));
}

checkColumns();