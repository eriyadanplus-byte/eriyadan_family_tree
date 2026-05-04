// Supabase PostgreSQL adapter — mirrors the mysql-db query() interface
// Requires the `run_sql` PostgreSQL function to be installed (see db/supabase/schema.sql)

import { supabase } from './supabase';

/**
 * Execute a SQL query via Supabase RPC.
 * For SELECT: returns an array of rows.
 * For INSERT: appends RETURNING id automatically; returns { insertId, affectedRows }.
 * For UPDATE/DELETE: returns { affectedRows: 1 }.
 */
export async function query(sql: string, params?: any[]): Promise<any> {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase().replace(/\s+/g, ' ');
  const firstWord = upper.split(' ')[0];
  const hasReturning = upper.includes(' RETURNING ');

  // Auto-append RETURNING id for plain INSERT so callers can use result.insertId
  const _sql = firstWord === 'INSERT' && !hasReturning ? trimmed + ' RETURNING id' : trimmed;

  const { data, error } = await supabase.rpc('run_sql', {
    _sql,
    _params: params ?? [],
  });

  if (error) {
    console.error('Supabase query error:', error.message, '| SQL:', sql);
    throw new Error(error.message);
  }

  const rows: any[] = (data as any[]) ?? [];

  if (firstWord === 'INSERT') {
    return { insertId: rows[0]?.id ?? null, affectedRows: rows.length };
  }
  if ((firstWord === 'UPDATE' || firstWord === 'DELETE') && !hasReturning) {
    return { affectedRows: 1 };
  }
  return rows;
}
