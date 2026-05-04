import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'family_tree',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query(sql: string, params: any[] = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function getConnection() {
  return await pool.getConnection();
}

// Singleton promise — ensures initDB() body runs exactly once per process,
// even when called concurrently from multiple route handlers during build.
let dbInitPromise: Promise<void> | null = null;

export function initDB(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = _initDB();
  }
  return dbInitPromise;
}

// Initialize database tables
async function withDeadlockRetry(fn: () => Promise<void>, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await fn();
      return;
    } catch (e: any) {
      if (e?.code === 'ER_LOCK_DEADLOCK' && i < retries - 1) {
        await new Promise(r => setTimeout(r, 50 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
}

async function _initDB() {
  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_id INT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NULL,
        mobile_number VARCHAR(50) NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'editor', 'contributor', 'viewer') DEFAULT 'viewer',
        status ENUM('pending', 'active', 'inactive') DEFAULT 'pending',
        can_approve TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create members table
    await query(`
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
        current_role VARCHAR(120),
        company VARCHAR(120),
        instagram VARCHAR(255),
        linkedin VARCHAR(255),
        twitter VARCHAR(255),
        facebook VARCHAR(255),
        youtube VARCHAR(255),
        whatsapp VARCHAR(20),
        father_id INT,
        mother_id INT,
        spouse_id INT,
        is_stub TINYINT(1) DEFAULT 0,
        claimed_by_user_id INT,
        added_by_member_id INT,
        avatar_version INT DEFAULT 0,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (father_id) REFERENCES members(id) ON DELETE SET NULL,
        FOREIGN KEY (mother_id) REFERENCES members(id) ON DELETE SET NULL,
        FOREIGN KEY (spouse_id) REFERENCES members(id) ON DELETE SET NULL,
        FOREIGN KEY (claimed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (added_by_member_id) REFERENCES members(id) ON DELETE SET NULL
      )
    `);

    // Create spouses table (symmetric marriage records)
    await query(`
      CREATE TABLE IF NOT EXISTS spouses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        member_a_id INT NOT NULL,
        member_b_id INT NOT NULL,
        status ENUM('current', 'former', 'late') DEFAULT 'current',
        since DATE NULL,
        until DATE NULL,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_spouses_a (member_a_id),
        INDEX idx_spouses_b (member_b_id),
        CONSTRAINT chk_spouses_order CHECK (member_a_id < member_b_id)
      )
    `);

    // Create approval_scopes table (editor subtree delegation)
    await query(`
      CREATE TABLE IF NOT EXISTS approval_scopes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        root_member_id INT NOT NULL,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_approval_scope (user_id, root_member_id),
        INDEX idx_approval_scope_user (user_id),
        INDEX idx_approval_scope_root (root_member_id)
      )
    `);

    // Create audit_log table
    await query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id VARCHAR(36) PRIMARY KEY,
        user_id INT NOT NULL,
        action VARCHAR(50) NOT NULL,
        target_member_id INT NULL,
        metadata TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (target_member_id) REFERENCES members(id)
      )
    `);

    // Create help_threads table (in-app messaging from signup users)
    await query(`
      CREATE TABLE IF NOT EXISTS help_threads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        anon_token_hash CHAR(64) NULL,
        trigger_stage ENUM('signup_start','signup_final_no_match','contact_form') NOT NULL,
        inquiry_kind ENUM('general','contact_form') NOT NULL DEFAULT 'general',
        status ENUM('open','pending_admin','resolved') NOT NULL DEFAULT 'open',
        context_snapshot JSON NULL,
        assigned_handler_id INT NULL,
        ancestor_name VARCHAR(255) NULL,
        place VARCHAR(255) NULL,
        contact_number VARCHAR(32) NULL,
        whatsapp_number VARCHAR(32) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        INDEX idx_help_threads_user (user_id),
        INDEX idx_help_threads_anon (anon_token_hash),
        INDEX idx_help_threads_status (status),
        INDEX idx_help_threads_handler (assigned_handler_id),
        CONSTRAINT chk_help_threads_owner CHECK (user_id IS NOT NULL OR anon_token_hash IS NOT NULL)
      )
    `);

    // Create help_messages table
    await query(`
      CREATE TABLE IF NOT EXISTS help_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        thread_id INT NOT NULL,
        sender_kind ENUM('user','anon','admin','editor') NOT NULL,
        sender_user_id INT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL,
        INDEX idx_help_messages_thread (thread_id, created_at),
        CONSTRAINT fk_help_messages_thread FOREIGN KEY (thread_id) REFERENCES help_threads(id) ON DELETE CASCADE
      )
    `);

    // Create messaging_handler_grants table (admin delegates inbox access to editors)
    await query(`
      CREATE TABLE IF NOT EXISTS messaging_handler_grants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        editor_user_id INT NOT NULL,
        granted_by_admin_id INT NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP NULL,
        INDEX idx_grants_editor (editor_user_id)
      )
    `);

    // Create app_settings table (persistent key-value config)
    await query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    const defaultSettings: [string, string][] = [
      ['siteName', "Eriyadan's Legacy"],
      ['allowRegistration', 'true'],
      ['requireApproval', 'true'],
      ['notifications', 'false'],
      ['hideAncestralPrivacy', 'false'],
      ['admin_help_alert_muted', '0'],
      ['inAppMessage', ''],
    ];
    for (const [key, value] of defaultSettings) {
      await withDeadlockRetry(() =>
        query('INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES (?, ?)', [key, value]) as Promise<any>
      );
    }

    // Add new columns to existing members table (safe for existing DBs)
    const dbName = process.env.MYSQL_DATABASE || 'family_tree';
    const membersColumns = [
      ['current_role VARCHAR(120) NULL', 'current_role'],
      ['company VARCHAR(120) NULL', 'company'],
      ['name VARCHAR(255) NULL', 'name'],
      ['is_stub TINYINT(1) DEFAULT 0', 'is_stub'],
      ['claimed_by_user_id INT NULL', 'claimed_by_user_id'],
      ['added_by_member_id INT NULL', 'added_by_member_id'],
      ['avatar_version INT DEFAULT 0', 'avatar_version'],
      ['facebook VARCHAR(255) NULL', 'facebook'],
      ['youtube VARCHAR(255) NULL', 'youtube'],
      ['created_via VARCHAR(50) NULL', 'created_via'],
    ];
    for (const [colDef, colName] of membersColumns) {
      const rows = await query(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'members' AND COLUMN_NAME = ?`,
        [dbName, colName]
      ) as any[];
      if (rows[0]?.cnt === 0) {
        try { await query(`ALTER TABLE members ADD COLUMN ${colDef}`); } catch (e) {}
      }
    }
    // Add new columns to users table
    const usersColumns = [
      ['can_approve TINYINT(1) DEFAULT 0', 'can_approve'],
      ['last_seen TIMESTAMP NULL', 'last_seen'],
      ['secondary_ancestor_id INT NULL', 'secondary_ancestor_id'],
      ["relation_type ENUM('child','spouse','sibling') NULL", 'relation_type'],
    ];
    for (const [colDef, colName] of usersColumns) {
      const rows = await query(
        `SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?`,
        [dbName, colName]
      ) as any[];
      if (rows[0]?.cnt === 0) {
        try { await query(`ALTER TABLE users ADD COLUMN ${colDef}`); } catch (e) {}
      }
    }

    // Create indexes (ignore errors if they already exist)
    const indexStatements = [
      `CREATE INDEX idx_members_generation ON members(generation)`,
      `CREATE INDEX idx_members_full_name ON members(full_name)`,
      `CREATE INDEX idx_members_mobile ON members(mobile_number)`,
      `CREATE INDEX idx_members_is_stub ON members(is_stub)`,
      `CREATE INDEX idx_members_father ON members(father_id)`,
      `CREATE INDEX idx_members_mother ON members(mother_id)`,
      `CREATE INDEX idx_users_email ON users(email)`,
      `CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp)`,
    ];
    for (const sql of indexStatements) {
      try { await query(sql); } catch (e) { /* index already exists, ignore */ }
    }

    console.log('Database tables initialized');
  } catch (error) {
    console.error('DB init error:', error);
  }
}

// Auto-initialize database tables on module import
initDB().catch(err => console.error('DB auto-init failed:', err));
