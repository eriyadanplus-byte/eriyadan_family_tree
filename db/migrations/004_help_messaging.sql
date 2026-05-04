-- Migration 004: In-app help messaging system
-- Tables: help_threads, help_messages, messaging_handler_grants

CREATE TABLE IF NOT EXISTS help_threads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  anon_token_hash CHAR(64) NULL,
  trigger_stage ENUM('signup_start','signup_final_no_match') NOT NULL,
  status ENUM('open','pending_admin','resolved') NOT NULL DEFAULT 'open',
  context_snapshot JSON NULL,
  assigned_handler_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  INDEX idx_help_threads_user (user_id),
  INDEX idx_help_threads_anon (anon_token_hash),
  INDEX idx_help_threads_status (status),
  INDEX idx_help_threads_handler (assigned_handler_id),
  CONSTRAINT chk_help_threads_owner CHECK (user_id IS NOT NULL OR anon_token_hash IS NOT NULL)
);

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
);

CREATE TABLE IF NOT EXISTS messaging_handler_grants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  editor_user_id INT NOT NULL,
  granted_by_admin_id INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP NULL,
  INDEX idx_grants_editor (editor_user_id)
);
