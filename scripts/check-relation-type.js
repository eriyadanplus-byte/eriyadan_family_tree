const m = require('mysql2/promise');
(async () => {
  const c = await m.createConnection({
    host: 'localhost', user: 'root', password: 'Sahara@2024', database: 'family_tree'
  });
  const [cols] = await c.execute('SHOW COLUMNS FROM users LIKE ?', ['relation_type']);
  console.log('relation_type column:', JSON.stringify(cols));
  const [pending] = await c.execute(
    "SELECT id, email, name, member_id, secondary_ancestor_id, relation_type, status FROM users WHERE status = 'pending'"
  );
  console.log('Pending users:', JSON.stringify(pending, null, 2));
  await c.end();
})();
