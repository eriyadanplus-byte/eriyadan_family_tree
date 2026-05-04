-- Migration 0002: profile fields (already in 0001 initial schema)
-- current_role, company columns were added in MySQL migration 002_profile_fields.sql
-- These columns are included in the initial D1 schema so this is a no-op migration
-- kept for sequence numbering parity with MySQL migrations.
SELECT 1;
