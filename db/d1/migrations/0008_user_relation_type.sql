-- D1 Migration 0008: persist relationType for couple/spouse/sibling signup
-- Run: wrangler d1 execute eriyaden --file=db/d1/migrations/0008_user_relation_type.sql

ALTER TABLE users ADD COLUMN relation_type TEXT NULL
  CHECK (relation_type IS NULL OR relation_type IN ('child','spouse','sibling'));
