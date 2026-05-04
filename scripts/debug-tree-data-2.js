const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1', port: 3306,
    user: 'root', password: 'root',
    database: 'family_tree'
  });

  const [members] = await conn.execute(
    'SELECT id, full_name, generation, father_id, mother_id, gender FROM members WHERE deleted_at IS NULL ORDER BY generation, id'
  );
  const [spouses] = await conn.execute(
    "SELECT member_a_id, member_b_id FROM spouses WHERE status = 'current'"
  );

  console.log('MEMBERS:');
  members.forEach(m => console.log('  id=' + m.id + ' gen=' + m.generation + ' name=' + m.full_name + ' father=' + m.father_id + ' mother=' + m.mother_id + ' gender=' + m.gender));

  console.log('SPOUSES:');
  spouses.forEach(s => console.log('  ' + s.member_a_id + ' <-> ' + s.member_b_id));

  await conn.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
