const mysql = require('mysql2/promise');

async function debug() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'family_tree',
  });

  try {
    const [members] = await conn.execute(
      'SELECT id, full_name, generation, father_id, mother_id, spouse_id, gender FROM members WHERE deleted_at IS NULL ORDER BY generation, full_name'
    );
    console.log('\n=== Members ===');
    for (const m of members) {
      console.log(`Gen ${m.generation}: ${m.full_name} (id=${m.id}) father=${m.father_id} mother=${m.mother_id} spouse=${m.spouse_id} gender=${m.gender}`);
    }

    const [spouses] = await conn.execute(
      "SELECT member_a_id, member_b_id FROM spouses WHERE status = 'current'"
    );
    console.log('\n=== Spouse Links ===');
    for (const s of spouses) {
      const a = members.find(m => m.id === s.member_a_id);
      const b = members.find(m => m.id === s.member_b_id);
      console.log(`${a?.full_name || s.member_a_id} <-> ${b?.full_name || s.member_b_id}`);
    }

    console.log('\n=== Parent-Child Analysis ===');
    const memberIds = new Set(members.map(m => String(m.id)));
    for (const m of members) {
      const f = m.father_id ? String(m.father_id) : null;
      const mo = m.mother_id ? String(m.mother_id) : null;
      const hasFather = f && memberIds.has(f);
      const hasMother = mo && memberIds.has(mo);
      if (f || mo) {
        console.log(`${m.full_name}: father=${f} found=${hasFather} | mother=${mo} found=${hasMother}`);
      }
    }
  } finally {
    await conn.end();
  }
}

debug().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
