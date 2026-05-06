-- Ensure (member_a_id, member_b_id) pairs are unique in the spouses table.
-- Required for setSpouse() ON CONFLICT upsert to work correctly.
-- Apply via: Supabase Dashboard → SQL Editor, or supabase db push

CREATE UNIQUE INDEX IF NOT EXISTS spouses_pair_unique
  ON spouses (member_a_id, member_b_id);
