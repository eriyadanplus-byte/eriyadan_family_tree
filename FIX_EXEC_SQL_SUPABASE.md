# exec_sql Function Fix for Supabase

Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/nbaygdkfkhhdxtmrperg/sql):

```sql
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS exec_sql(TEXT, JSONB);

-- Create the exec_sql function
CREATE OR REPLACE FUNCTION exec_sql(_sql TEXT, _params JSONB DEFAULT '[]')
RETURNS JSONB AS $$
DECLARE
  result     JSONB;
  pg_sql     TEXT := _sql;
  n          INT  := jsonb_array_length(_params);
  i          INT;
  v          JSONB;
  first_word TEXT;
BEGIN
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

  first_word := upper(split_part(
    regexp_replace(btrim(pg_sql), '\s+', ' ', 'g'), ' ', 1));

  IF first_word = 'SELECT' THEN
    EXECUTE format('SELECT jsonb_agg(t) FROM (%s) t', pg_sql) INTO result;
    RETURN COALESCE(result, '[]'::JSONB);
  ELSIF pg_sql ~* '\mRETURNING\M' THEN
    EXECUTE format('WITH t AS (%s) SELECT jsonb_agg(t) FROM t', pg_sql) INTO result;
    RETURN COALESCE(result, '[]'::JSONB);
  ELSE
    EXECUTE pg_sql;
    RETURN '[]'::JSONB;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Grant execution to anon and authenticated roles
GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO anon, authenticated;

-- Verify the function exists
SELECT proname, pronargs
FROM pg_proc
WHERE proname = 'exec_sql';
```

After running this:
1. Restart your dev server: `npm run dev`
2. Test at http://localhost:3000/tree