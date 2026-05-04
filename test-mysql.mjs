import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'family_tree',
});

try {
  console.log('Testing MySQL connection...');
  
  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
  console.log('Users table:', rows);
  
  const [members] = await connection.execute('SELECT COUNT(*) as count FROM members');
  console.log('Members table:', members);
  
  console.log('✅ MySQL is working!');
} catch (error) {
  console.error('❌ MySQL error:', error.message);
} finally {
  await connection.end();
}
