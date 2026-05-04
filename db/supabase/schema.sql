-- Supabase PostgreSQL Schema for Eriyadan's Legacy Family Tree
-- Run in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- run_sql helper: allows generic SQL execution via RPC (used by supabase-db.ts)
CREATE OR REPLACE FUNCTION run_sql(_sql TEXT, _params JSONB DEFAULT '[]')
RETURNS JSONB AS $$
DECLARE
  result     JSONB;
  pg_sql     TEXT := _sql;
  n          INT  := jsonb_array_length(_params);
  i          INT;
  v          JSONB;
  first_word TEXT;
BEGIN
  -- Replace each ? placeholder with the corresponding quoted/typed literal
  FOR i IN 0..(n - 1) LOOP
    v := _params->i;
    IF v IS NULL OR v = 'null'::jsonb THEN
      pg_sql := regexp_replace(pg_sql, '[?]', 'NULL', '');
    ELSIF jsonb_typeof(v) = 'boolean' THEN
      pg_sql := regexp_replace(pg_sql, '[?]',
        CASE WHEN (v::text = 'true') THEN 'TRUE' ELSE 'FALSE' END, '');
    ELSIF jsonb_typeof(v) = 'number' THEN
      pg_sql := regexp_replace(pg_sql, '[?]', (v #>> '{}'), '');
    ELSE
      pg_sql := regexp_replace(pg_sql, '[?]', quote_literal(v #>> '{}'), '');
    END IF;
  END LOOP;

  -- Identify statement type
  first_word := upper(split_part(
    regexp_replace(btrim(pg_sql), '\s+', ' ', 'g'), ' ', 1));

  -- SELECT or any DML with RETURNING → return rows as JSONB array
  IF first_word = 'SELECT' OR pg_sql ~* '\mRETURNING\M' THEN
    EXECUTE format('SELECT jsonb_agg(t) FROM (%s) t', pg_sql)
      INTO result;
    RETURN COALESCE(result, '[]'::JSONB);
  ELSE
    -- Plain DML (INSERT/UPDATE/DELETE without RETURNING)
    EXECUTE pg_sql;
    RETURN '[]'::JSONB;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    profile_photo_url TEXT,
    dob TEXT,
    dod TEXT,
    is_late BOOLEAN DEFAULT FALSE,
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
    father_id UUID,
    mother_id UUID,
    generation INTEGER,
    is_stub BOOLEAN DEFAULT FALSE,
    claimed_by_user_id UUID,
    added_by_member_id UUID,
    avatar_version INTEGER DEFAULT 0,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    FOREIGN KEY (father_id) REFERENCES members(id) ON DELETE SET NULL,
    FOREIGN KEY (mother_id) REFERENCES members(id) ON DELETE SET NULL
);

-- Relationships table
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL,
    related_member_id UUID NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (related_member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Spouses table (symmetric marriage records)
CREATE TABLE IF NOT EXISTS spouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_a_id UUID NOT NULL,
    member_b_id UUID NOT NULL,
    status TEXT DEFAULT 'current',
    since TEXT,
    until TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (member_a_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (member_b_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT chk_spouse_order CHECK (member_a_id < member_b_id)
);

-- Users table (auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    mobile_number TEXT,
    role TEXT DEFAULT 'viewer',
    status TEXT DEFAULT 'pending',
    can_approve BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);

-- Approval scopes table (editor subtree delegation)
CREATE TABLE IF NOT EXISTS approval_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    root_member_id UUID NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (root_member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    can_add BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    scope TEXT DEFAULT 'own',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    target_member_id UUID,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_member_id) REFERENCES members(id) ON DELETE SET NULL
);

-- App config table
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help threads
CREATE TABLE IF NOT EXISTS help_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    anon_token_hash TEXT,
    trigger_stage TEXT,
    context_snapshot JSONB,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Help messages
CREATE TABLE IF NOT EXISTS help_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL,
    sender_kind TEXT NOT NULL,
    sender_id UUID,
    sender_name TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (thread_id) REFERENCES help_threads(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_members_generation ON members(generation);
CREATE INDEX IF NOT EXISTS idx_members_full_name ON members USING gin(to_tsvector('simple', full_name));
CREATE INDEX IF NOT EXISTS idx_members_mobile ON members(mobile_number);
CREATE INDEX IF NOT EXISTS idx_members_is_stub ON members(is_stub);
CREATE INDEX IF NOT EXISTS idx_members_father ON members(father_id);
CREATE INDEX IF NOT EXISTS idx_members_mother ON members(mother_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_can_approve ON users(can_approve);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
CREATE INDEX IF NOT EXISTS idx_users_status_last_seen ON users(status, last_seen) WHERE last_seen IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_relationships_member ON relationships(member_id);
CREATE INDEX IF NOT EXISTS idx_spouses_a ON spouses(member_a_id);
CREATE INDEX IF NOT EXISTS idx_spouses_b ON spouses(member_b_id);
CREATE INDEX IF NOT EXISTS idx_approval_scopes_user ON approval_scopes(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_scopes_root ON approval_scopes(root_member_id);
CREATE INDEX IF NOT EXISTS idx_help_threads_user ON help_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_help_threads_status ON help_threads(status);

-- updated_at trigger for members
CREATE OR REPLACE FUNCTION update_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS members_updated_at ON members;
CREATE TRIGGER members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_members_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE spouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: members — authenticated users can read, admins can write
CREATE POLICY "members_select_all"
  ON members FOR SELECT
  USING (true);

CREATE POLICY "members_insert_admin"
  ON members FOR INSERT
  WITH CHECK (true); -- enforced by app-layer role checks

CREATE POLICY "members_update_admin"
  ON members FOR UPDATE
  USING (true);

CREATE POLICY "members_delete_admin"
  ON members FOR DELETE
  USING (true);

-- RLS Policies: users — users can read their own, admins can read all
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (true); -- app-layer controls visibility

CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  USING (true);

-- RLS Policies: audit_log — append-only, no delete
CREATE POLICY "audit_log_insert"
  ON audit_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "audit_log_select"
  ON audit_log FOR SELECT
  USING (true);

-- RLS Policies: help_threads / help_messages — anon + auth
CREATE POLICY "help_threads_select"
  ON help_threads FOR SELECT
  USING (true);

CREATE POLICY "help_threads_insert"
  ON help_threads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "help_messages_select"
  ON help_messages FOR SELECT
  USING (true);

CREATE POLICY "help_messages_insert"
  ON help_messages FOR INSERT
  WITH CHECK (true);
