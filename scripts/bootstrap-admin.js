const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'Eriyadan@2024!';

async function bootstrap() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'family_tree',
  });

  try {
    console.log('Hashing admin password...');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    // Check if admin already exists
    const [existing] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE email = ?',
      ['eriyadanplus@gmail.com']
    );

    if (existing[0].count > 0) {
      console.log('Admin user already exists, skipping bootstrap.');
      await connection.end();
      return;
    }

    // Create the sole admin user — no family members, tree starts empty
    await connection.execute(
      `INSERT INTO users (email, name, mobile_number, password, role, status, can_approve)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['eriyadanplus@gmail.com', 'Admin User', '+0000000000', hashedPassword, 'super_admin', 'active', 1]
    );

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  Eriyadan\'s Legacy — Admin Bootstrap Complete            ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  Email:    eriyadanplus@gmail.com                        ║');
    console.log('║  Password: Eriyadan@2024!                                ║');
    console.log('║  Role:     super_admin                                   ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log('║  IMPORTANT: Change the default password immediately      ║');
    console.log('║  via Admin → Settings → Account Security after login.    ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('No family members were created. Use the Generation Seed');
    console.log('feature in the admin panel to add yourself to the tree.');
    console.log('');
  } catch (error) {
    console.error('Bootstrap failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

bootstrap();
