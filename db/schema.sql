-- Cloudflare D1 Database Schema for Eriyadan's Legacy Family Tree
-- Run with: wrangler d1 execute eriyaden_legacy --file=./drizzle/schema.sql

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    profile_photo_url TEXT,
    dob TEXT,
    dod TEXT,
    is_late INTEGER DEFAULT 0,
    gender TEXT,
    location TEXT,
    bio TEXT,
    instagram TEXT,
    facebook TEXT,
    linkedin TEXT,
    twitter TEXT,
    youtube TEXT,
    whatsapp TEXT,
    custom_link_label TEXT,
    custom_link_url TEXT,
    father_id TEXT,
    mother_id TEXT,
    generation INTEGER,
    is_stub INTEGER DEFAULT 0,
    claimed_by_user_id TEXT,
    added_by_member_id TEXT,
    avatar_version INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    foreign key (father_id) references members(id),
    foreign key (mother_id) references members(id)
);

-- Relationships table
CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    related_member_id TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    foreign key (member_id) references members(id),
    foreign key (related_member_id) references members(id)
);

-- Spouses table (symmetric marriage records)
CREATE TABLE IF NOT EXISTS spouses (
    id TEXT PRIMARY KEY,
    member_a_id TEXT NOT NULL,
    member_b_id TEXT NOT NULL,
    status TEXT DEFAULT 'current',
    since TEXT,
    until TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    foreign key (member_a_id) references members(id),
    foreign key (member_b_id) references members(id)
);

-- Users table (auth)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    member_id TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    status TEXT DEFAULT 'pending',
    can_approve INTEGER DEFAULT 0,
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    foreign key (member_id) references members(id)
);

-- Approval scopes table (editor subtree delegation)
CREATE TABLE IF NOT EXISTS approval_scopes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    root_member_id TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    foreign key (user_id) references users(id),
    foreign key (root_member_id) references members(id)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    can_add INTEGER DEFAULT 0,
    can_edit INTEGER DEFAULT 0,
    can_delete INTEGER DEFAULT 0,
    can_export INTEGER DEFAULT 0,
    scope TEXT DEFAULT 'own',
    created_at TEXT DEFAULT (datetime('now')),
    foreign key (user_id) references users(id)
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_member_id TEXT,
    metadata TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    foreign key (user_id) references users(id),
    foreign key (target_member_id) references members(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_generation ON members(generation);
CREATE INDEX IF NOT EXISTS idx_members_full_name ON members(full_name);
CREATE INDEX IF NOT EXISTS idx_members_mobile ON members(mobile_number);
CREATE INDEX IF NOT EXISTS idx_members_is_stub ON members(is_stub);
CREATE INDEX IF NOT EXISTS idx_members_father ON members(father_id);
CREATE INDEX IF NOT EXISTS idx_members_mother ON members(mother_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_can_approve ON users(can_approve);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_relationships_member ON relationships(member_id);
CREATE INDEX IF NOT EXISTS idx_spouses_a ON spouses(member_a_id);
CREATE INDEX IF NOT EXISTS idx_spouses_b ON spouses(member_b_id);
CREATE INDEX IF NOT EXISTS idx_approval_scopes_user ON approval_scopes(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_scopes_root ON approval_scopes(root_member_id);

-- Trigger for updated_at
CREATE TRIGGER IF NOT EXISTS members_updated_at 
AFTER UPDATE ON members FOR EACH ROW
BEGIN
    UPDATE members SET updated_at = datetime('now') WHERE id = OLD.id;
END;