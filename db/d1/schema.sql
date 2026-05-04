-- Eriyadan's Legacy — Cloudflare D1 / SQLite Schema
-- Complete schema converted from MySQL source in src/lib/mysql-db.ts
-- Apply via: wrangler d1 migrations apply eriyaden --local

PRAGMA foreign_keys = ON;

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id     INTEGER NULL,
  email         TEXT    UNIQUE NOT NULL,
  name          TEXT    NULL,
  mobile_number TEXT    NULL,
  password      TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'viewer'
                CHECK (role IN ('super_admin','editor','contributor','viewer')),
  status        TEXT    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','active','inactive')),
  can_approve   INTEGER NOT NULL DEFAULT 0 CHECK (can_approve IN (0,1)),
  last_seen     TEXT    NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now')))
);

CREATE TRIGGER IF NOT EXISTS users_updated_at
AFTER UPDATE ON users FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- ─── Members ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name           TEXT    NOT NULL,
  mobile_number       TEXT    NOT NULL,
  email               TEXT    NULL,
  generation          INTEGER NOT NULL,
  is_late             INTEGER NOT NULL DEFAULT 0 CHECK (is_late IN (0,1)),
  birth_year          INTEGER NULL,
  death_year          INTEGER NULL,
  role                TEXT    NOT NULL DEFAULT 'viewer'
                      CHECK (role IN ('super_admin','editor','contributor','viewer')),
  profile_photo_url   TEXT    NULL,
  gender              TEXT    NULL CHECK (gender IN ('male','female','other',NULL)),
  dob                 TEXT    NULL,
  dod                 TEXT    NULL,
  location            TEXT    NULL,
  bio                 TEXT    NULL,
  current_role        TEXT    NULL,
  company             TEXT    NULL,
  instagram           TEXT    NULL,
  linkedin            TEXT    NULL,
  twitter             TEXT    NULL,
  facebook            TEXT    NULL,
  youtube             TEXT    NULL,
  whatsapp            TEXT    NULL,
  father_id           INTEGER NULL REFERENCES members(id) ON DELETE SET NULL,
  mother_id           INTEGER NULL REFERENCES members(id) ON DELETE SET NULL,
  spouse_id           INTEGER NULL REFERENCES members(id) ON DELETE SET NULL,
  is_stub             INTEGER NOT NULL DEFAULT 0 CHECK (is_stub IN (0,1)),
  claimed_by_user_id  INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  added_by_member_id  INTEGER NULL REFERENCES members(id) ON DELETE SET NULL,
  avatar_version      INTEGER NOT NULL DEFAULT 0,
  created_by          TEXT    NULL,
  created_via         TEXT    NULL,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at          TEXT    NULL
);

CREATE TRIGGER IF NOT EXISTS members_updated_at
AFTER UPDATE ON members FOR EACH ROW
BEGIN
  UPDATE members SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE INDEX IF NOT EXISTS idx_members_generation ON members(generation);
CREATE INDEX IF NOT EXISTS idx_members_full_name   ON members(full_name);
CREATE INDEX IF NOT EXISTS idx_members_mobile      ON members(mobile_number);
CREATE INDEX IF NOT EXISTS idx_members_is_stub     ON members(is_stub);
CREATE INDEX IF NOT EXISTS idx_members_father      ON members(father_id);
CREATE INDEX IF NOT EXISTS idx_members_mother      ON members(mother_id);

-- ─── Spouses ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spouses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  member_a_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_b_id  INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status       TEXT    NOT NULL DEFAULT 'current'
               CHECK (status IN ('current','former','late')),
  since        TEXT    NULL,
  until        TEXT    NULL,
  created_by   TEXT    NULL,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  CHECK (member_a_id < member_b_id)
);

CREATE TRIGGER IF NOT EXISTS spouses_updated_at
AFTER UPDATE ON spouses FOR EACH ROW
BEGIN
  UPDATE spouses SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE INDEX IF NOT EXISTS idx_spouses_a ON spouses(member_a_id);
CREATE INDEX IF NOT EXISTS idx_spouses_b ON spouses(member_b_id);

-- ─── Relationships ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS relationships (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id         INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  related_member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type              TEXT    NOT NULL
                    CHECK (type IN ('father','mother','spouse')),
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_relationships_member ON relationships(member_id);

-- ─── Approval Scopes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approval_scopes (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  root_member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_by     TEXT    NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, root_member_id)
);

CREATE INDEX IF NOT EXISTS idx_approval_scope_user ON approval_scopes(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_scope_root ON approval_scopes(root_member_id);

-- ─── App Settings ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER IF NOT EXISTS app_settings_updated_at
AFTER UPDATE ON app_settings FOR EACH ROW
BEGIN
  UPDATE app_settings SET updated_at = datetime('now') WHERE key = OLD.key;
END;

-- ─── Audit Log ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id               TEXT    PRIMARY KEY,  -- UUID
  user_id          INTEGER NOT NULL REFERENCES users(id),
  action           TEXT    NOT NULL,
  target_member_id INTEGER NULL REFERENCES members(id),
  metadata         TEXT    NULL,  -- JSON stored as TEXT
  timestamp        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- ─── Help Threads ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS help_threads (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id             INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  anon_token_hash     TEXT    NULL,
  trigger_stage       TEXT    NOT NULL
                      CHECK (trigger_stage IN ('signup_start','signup_final_no_match','contact_form')),
  inquiry_kind        TEXT    NOT NULL DEFAULT 'general'
                      CHECK (inquiry_kind IN ('general','contact_form')),
  status              TEXT    NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open','pending_admin','resolved')),
  context_snapshot    TEXT    NULL,  -- JSON stored as TEXT
  assigned_handler_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  ancestor_name       TEXT    NULL,
  place               TEXT    NULL,
  contact_number      TEXT    NULL,
  whatsapp_number     TEXT    NULL,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  resolved_at         TEXT    NULL
);

CREATE INDEX IF NOT EXISTS idx_help_threads_user    ON help_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_help_threads_anon    ON help_threads(anon_token_hash);
CREATE INDEX IF NOT EXISTS idx_help_threads_status  ON help_threads(status);
CREATE INDEX IF NOT EXISTS idx_help_threads_handler ON help_threads(assigned_handler_id);

-- ─── Help Messages ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS help_messages (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id      INTEGER NOT NULL REFERENCES help_threads(id) ON DELETE CASCADE,
  sender_kind    TEXT    NOT NULL
                 CHECK (sender_kind IN ('user','anon','admin','editor')),
  sender_user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  body           TEXT    NOT NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  read_at        TEXT    NULL
);

CREATE INDEX IF NOT EXISTS idx_help_messages_thread ON help_messages(thread_id, created_at);

-- ─── Messaging Handler Grants ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messaging_handler_grants (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  editor_user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by_admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  revoked_at          TEXT    NULL
);

CREATE INDEX IF NOT EXISTS idx_grants_editor ON messaging_handler_grants(editor_user_id);
