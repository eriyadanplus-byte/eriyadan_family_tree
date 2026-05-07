// Supabase SDK adapter — replaces the run_sql SECURITY DEFINER RPC.
// Simple single-table queries use the SDK directly (.from().select/insert/update/delete).
// Complex queries (JOINs, CTEs, subqueries) use exec_sql (SECURITY INVOKER — RLS enforced).

import { getSupabaseAdmin } from './supabase-admin';

type Row = Record<string, any>;

// ─── SQL parser helpers ────────────────────────────────────────────────────

function firstWord(sql: string) {
  return sql.trim().replace(/\s+/g, ' ').split(' ')[0].toUpperCase();
}

function isSimpleSelect(sql: string) {
  const upper = sql.toUpperCase();
  // Simple = no JOIN, no subquery, no CTE, single FROM table
  return (
    !upper.includes(' JOIN ') &&
    !upper.includes(' WITH ') &&
    !/\(\s*SELECT/i.test(sql) &&
    (upper.match(/\bFROM\b/g) || []).length === 1
  );
}

function isSimpleSingleTable(sql: string) {
  const upper = sql.toUpperCase();
  return (
    !upper.includes(' JOIN ') &&
    !upper.includes(' WITH ') &&
    !/\(\s*SELECT/i.test(sql)
  );
}

/** Replace ? placeholders with actual values (for SDK filter building) */
function bindParams(sql: string, params: any[]): string {
  let i = 0;
  return sql.replace(/\?/g, () => {
    const v = params[i++];
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
    if (typeof v === 'number') return String(v);
    return `'${String(v).replace(/'/g, "''")}'`;
  });
}

/** Extract table name from a simple SQL statement */
function extractTable(sql: string): string | null {
  const m = sql.match(/(?:FROM|INTO|UPDATE|DELETE\s+FROM)\s+["']?(\w+)["']?/i);
  return m ? m[1] : null;
}

/** Parse WHERE clause conditions for simple equality filters */
function parseWhereEq(sql: string, params: any[]): Record<string, any> | null {
  // Only handle simple "WHERE col = ? AND col2 = ?" patterns
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|$)/is);
  if (!whereMatch) return {};
  const clause = whereMatch[1].trim();
  // Reject complex conditions
  if (/\bOR\b|\bLIKE\b|\bIN\b|\bIS\s+NULL\b|\bIS\s+NOT\b|[<>!]|INTERVAL|NOW\(\)/i.test(clause)) return null;
  const parts = clause.split(/\s+AND\s+/i);
  const filters: Record<string, any> = {};
  let paramIdx = 0;
  for (const part of parts) {
    const m = part.trim().match(/^["']?(\w+)["']?\s*=\s*\?$/);
    if (!m) return null;
    filters[m[1]] = params[paramIdx++];
  }
  return filters;
}

// ─── SDK-based simple SELECT ───────────────────────────────────────────────

async function sdkSelect(sql: string, params: any[]): Promise<Row[]> {
  const table = extractTable(sql);
  if (!table) return execSql(sql, params);

  let q = getSupabaseAdmin().from(table).select('*');

  // Apply simple equality WHERE filters
  const filters = parseWhereEq(sql, params);
  if (filters === null) return execSql(sql, params); // complex WHERE — fall back
  for (const [col, val] of Object.entries(filters)) {
    if (val === null) q = (q as any).is(col, null);
    else q = (q as any).eq(col, val);
  }

  // ORDER BY
  const orderMatch = sql.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/is);
  if (orderMatch) {
    const orderParts = orderMatch[1].split(',');
    for (const part of orderParts) {
      const m = part.trim().match(/^["']?(\w+)["']?(?:\s+(ASC|DESC))?/i);
      if (m) q = (q as any).order(m[1], { ascending: (m[2] || 'ASC').toUpperCase() === 'ASC' });
    }
  }

  // LIMIT
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) q = (q as any).limit(parseInt(limitMatch[1]));

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data as Row[]) ?? [];
}

// ─── SDK-based INSERT ──────────────────────────────────────────────────────

async function sdkInsert(sql: string, params: any[]): Promise<{ insertId: any; affectedRows: number }> {
  const table = extractTable(sql);
  if (!table) {
    const rows = await execSql(sql + (sql.toUpperCase().includes('RETURNING') ? '' : ' RETURNING id'), params);
    return { insertId: rows[0]?.id ?? null, affectedRows: rows.length };
  }

  // Parse column names from INSERT INTO table (col1, col2, ...) VALUES (?, ?, ...)
  const colMatch = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
  if (!colMatch) return execSql(sql + ' RETURNING id', params).then(rows => ({ insertId: rows[0]?.id ?? null, affectedRows: rows.length }));

  const cols = colMatch[1].split(',').map(c => c.trim().replace(/"/g, ''));
  const row: Row = {};
  cols.forEach((col, i) => { row[col] = params[i] ?? null; });

  const { data, error } = await getSupabaseAdmin().from(table).insert(row).select('id').single();
  if (error) throw new Error(error.message);
  return { insertId: (data as any)?.id ?? null, affectedRows: 1 };
}

// ─── SDK-based UPDATE ──────────────────────────────────────────────────────

async function sdkUpdate(sql: string, params: any[]): Promise<{ affectedRows: number }> {
  console.log('[sdkUpdate] SQL:', sql, '| params:', params);
  if (!isSimpleSingleTable(sql)) {
    await execSql(sql, params);
    return { affectedRows: 1 };
  }

  const table = extractTable(sql);
  if (!table) { await execSql(sql, params); return { affectedRows: 1 }; }

  // Parse SET clause: "SET col1 = ?, col2 = ?"
  const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/is);
  if (!setMatch) { await execSql(sql, params); return { affectedRows: 1 }; }

  const setParts = setMatch[1].split(',');
  const updates: Row = {};
  let paramIdx = 0;
  for (const part of setParts) {
    const m = part.trim().match(/^["']?(\w+)["']?\s*=\s*(?:COALESCE\(\s*)?\?/i);
    if (!m) { await execSql(sql, params); return { affectedRows: 1 }; }
    updates[m[1]] = params[paramIdx++];
  }

  // Parse WHERE
  const whereFilters = parseWhereEq(sql.replace(/^.*?WHERE/is, 'WHERE'), params.slice(paramIdx));
  if (whereFilters === null) { await execSql(sql, params); return { affectedRows: 1 }; }

  let q = getSupabaseAdmin().from(table).update(updates);
  for (const [col, val] of Object.entries(whereFilters)) {
    if (val === null) q = (q as any).is(col, null);
    else q = (q as any).eq(col, val);
  }

  const { error, count } = await q;
  if (error) {
    console.error('[sdkUpdate] Error:', error.message);
    throw new Error(error.message);
  }
  console.log('[sdkUpdate] Success, count:', count);
  return { affectedRows: count || 1 };
}

// ─── SDK-based DELETE ──────────────────────────────────────────────────────

async function sdkDelete(sql: string, params: any[]): Promise<{ affectedRows: number }> {
  // Always use run_sql for DELETE — SDK delete without explicit filter is blocked by Supabase
  await execSql(sql, params);
  return { affectedRows: 1 };
}

// ─── Fallback: exec_sql RPC (SECURITY INVOKER — RLS enforced) ─────────────

async function execSql(sql: string, params: any[] = []): Promise<Row[]> {
  // Replace ? placeholders with actual values for debugging
  let debugSql = sql;
  let paramArray = [...params];
  for (const p of paramArray) {
    const replacement = p === null ? 'NULL' : typeof p === 'boolean' ? (p ? 'TRUE' : 'FALSE') : typeof p === 'number' ? String(p) : `'${String(p).replace(/'/g, "''")}'`;
    debugSql = debugSql.replace('?', replacement);
  }
  console.log('[execSql] SQL:', debugSql);
  
  try {
    const { data, error } = await getSupabaseAdmin().rpc('exec_sql', {
      _sql: sql,
      _params: params,
    });
    if (error) {
      console.error('[execSql] RPC Error:', error.message, '| code:', error.code, '| details:', error.details);
      throw new Error(error.message);
    }
    console.log('[execSql] Result count:', data?.length || 0);
    return (data as Row[]) ?? [];
  } catch (err: any) {
    console.error('[execSql] Exception:', err.message);
    throw err;
  }
}

// ─── Public query() interface ──────────────────────────────────────────────

export async function query(sql: string, params: any[] = []): Promise<any> {
  const trimmed = sql.trim();
  const verb = firstWord(trimmed);
  const upper = trimmed.toUpperCase();
  const hasReturning = upper.includes(' RETURNING ');

  console.log('[query] Using execSql for all queries | verb:', verb);

  try {
    // For simplicity, use execSql for all queries - it works
    if (verb === 'SELECT') {
      return execSql(trimmed, params);
    }

    if (verb === 'INSERT') {
      // Use SDK for simple INSERTs — correct boolean/type handling
      // Fall back to execSql only when ON CONFLICT is present (upsert)
      if (!upper.includes(' ON CONFLICT ')) {
        return sdkInsert(trimmed, params);
      }
      const rows = await execSql(trimmed, params);
      return { insertId: rows[0]?.id ?? null, affectedRows: rows.length };
    }

    if (verb === 'UPDATE') {
      await execSql(trimmed, params);
      return { affectedRows: 1 };
    }

    if (verb === 'DELETE') {
      await execSql(trimmed, params);
      return { affectedRows: 1 };
    }

    // DDL / other
    await execSql(trimmed, params);
    return [];
  } catch (err: any) {
    console.error('[query] ERROR:', err.message, '| sql:', trimmed.substring(0, 100));
    throw err;
  }
}
