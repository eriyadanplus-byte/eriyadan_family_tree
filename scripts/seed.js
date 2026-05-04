// ⚠️  DEV-ONLY: This script creates demo family members + 3 demo users.
// For production fresh deploys, use `scripts/bootstrap-admin.js` instead.

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;
const DEMO_PASSWORD = 'demo123';

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'root',
    database: process.env.MYSQL_DATABASE || 'family_tree',
  });

  try {
    console.log('Hashing demo passwords...');
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

    // Check if users already exist
    const [existing] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE email IN (?, ?, ?)',
      ['admin@eriyaden.com', 'editor@eriyaden.com', 'viewer@eriyaden.com']
    );

    if (existing[0].count > 0) {
      console.log(`Users already exist (${existing[0].count}), skipping seed.`);
      await connection.end();
      return;
    }

    // Create root ancestor (Gen 1) — male
    const [ancestorMale] = await connection.execute(
      `INSERT INTO members (full_name, mobile_number, email, generation, is_late, gender, location, bio, is_stub, avatar_version, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Eriyadan Ancestor', '+0000000000', 'ancestor@eriyaden.com', 1, 0, 'male', 'Unknown', 'The root ancestor of the Eriyadan family tree.', 0, 0, 'system']
    );
    const ancestorId = ancestorMale.insertId;

    // Create root ancestor spouse (Gen 1) — female
    const [ancestorFemale] = await connection.execute(
      `INSERT INTO members (full_name, mobile_number, email, generation, is_late, gender, location, bio, is_stub, avatar_version, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Eriyadan Ancestress', '+0000000001', 'ancestress@eriyaden.com', 1, 0, 'female', 'Unknown', 'The root ancestress of the Eriyadan family tree.', 0, 0, 'system']
    );
    const ancestressId = ancestorFemale.insertId;

    // Link spouses
    await connection.execute(
      `INSERT INTO spouses (member_a_id, member_b_id, status, created_by) VALUES (?, ?, ?, ?)`,
      [Math.min(ancestorId, ancestressId), Math.max(ancestorId, ancestressId), 'current', 'system']
    );

    // Create Gen 2 child (male)
    const [childGen2] = await connection.execute(
      `INSERT INTO members (full_name, mobile_number, email, generation, is_late, gender, location, bio, father_id, mother_id, is_stub, avatar_version, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Abdullah Eriyadan', '+0000000002', 'abdullah@eriyaden.com', 2, 0, 'male', 'Malappuram', 'Second generation, son of Eriyadan.', ancestorId, ancestressId, 0, 0, 'system']
    );
    const childGen2Id = childGen2.insertId;

    // Create Gen 2 child spouse (female)
    const [spouseGen2] = await connection.execute(
      `INSERT INTO members (full_name, mobile_number, email, generation, is_late, gender, location, bio, is_stub, avatar_version, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Fatima Eriyadan', '+0000000003', 'fatima@eriyaden.com', 2, 0, 'female', 'Malappuram', 'Second generation, wife of Abdullah.', 0, 0, 'system']
    );
    const spouseGen2Id = spouseGen2.insertId;

    // Link Gen 2 spouses
    await connection.execute(
      `INSERT INTO spouses (member_a_id, member_b_id, status, created_by) VALUES (?, ?, ?, ?)`,
      [Math.min(childGen2Id, spouseGen2Id), Math.max(childGen2Id, spouseGen2Id), 'current', 'system']
    );

    // Create Gen 3 child
    const [childGen3] = await connection.execute(
      `INSERT INTO members (full_name, mobile_number, email, generation, is_late, gender, location, bio, father_id, mother_id, is_stub, avatar_version, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Yousuf Eriyadan', '+0000000004', 'yousuf@eriyaden.com', 3, 0, 'male', 'Malappuram', 'Third generation, son of Abdullah and Fatima.', childGen2Id, spouseGen2Id, 0, 0, 'system']
    );
    const childGen3Id = childGen3.insertId;

    // Create demo users
    const users = [
      { email: 'admin@eriyaden.com', name: 'Admin User', mobile: '+1111111111', role: 'super_admin', status: 'active', memberId: ancestorId, canApprove: 1 },
      { email: 'editor@eriyaden.com', name: 'Editor User', mobile: '+2222222222', role: 'editor', status: 'active', memberId: childGen2Id, canApprove: 0 },
      { email: 'viewer@eriyaden.com', name: 'Viewer User', mobile: '+3333333333', role: 'viewer', status: 'active', memberId: childGen3Id, canApprove: 0 },
    ];

    for (const user of users) {
      await connection.execute(
        `INSERT INTO users (email, name, mobile_number, password, role, status, can_approve, member_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.email, user.name, user.mobile, hashedPassword, user.role, user.status, user.canApprove, user.memberId || null]
      );
      console.log(`Created user: ${user.email} (${user.role})`);
    }

    console.log('Seed complete!');
    console.log('');
    console.log('Demo credentials:');
    console.log('  admin@eriyaden.com    / demo123  (super_admin)');
    console.log('  editor@eriyaden.com   / demo123  (editor)');
    console.log('  viewer@eriyaden.com   / demo123  (viewer)');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
