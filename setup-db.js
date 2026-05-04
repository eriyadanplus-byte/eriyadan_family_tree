// Quick MySQL setup script
const mysql = require('mysql2/promise');

const password = process.env.MYSQL_PASSWORD || '';

async function setup() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: password,
  });

  try {
    console.log('Creating database...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS family_tree');
    await connection.execute('USE family_tree');

    console.log('Creating users table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'editor', 'contributor', 'viewer') DEFAULT 'viewer',
        status ENUM('pending', 'active', 'inactive') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating members table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        generation INT NOT NULL,
        is_late BOOLEAN DEFAULT false,
        birth_year INT,
        death_year INT,
        role ENUM('super_admin', 'editor', 'contributor', 'viewer') DEFAULT 'viewer',
        profile_photo_url VARCHAR(500),
        gender ENUM('male', 'female', 'other'),
        dob DATE,
        dod DATE,
        location VARCHAR(255),
        bio TEXT,
        instagram VARCHAR(255),
        linkedin VARCHAR(255),
        twitter VARCHAR(255),
        whatsapp VARCHAR(20),
        father_id INT,
        mother_id INT,
        spouse_id INT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (father_id) REFERENCES members(id) ON DELETE SET NULL,
        FOREIGN KEY (mother_id) REFERENCES members(id) ON DELETE SET NULL,
        FOREIGN KEY (spouse_id) REFERENCES members(id) ON DELETE SET NULL
      )
    `);

    console.log('Setup complete!');
    console.log('Now run: npm run dev');
  } catch (error) {
    console.error('Setup failed:', error.message);
  } finally {
    await connection.end();
  }
}

setup();
