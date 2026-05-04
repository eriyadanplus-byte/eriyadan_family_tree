// mysql-db.ts — stubbed out.
// MySQL is no longer used in production; all queries route through Supabase.
// This module is kept so any legacy import paths don't break at build time.

export async function query(_sql: string, _params?: any[]): Promise<any> {
  throw new Error('MySQL is disabled. DATABASE_PROVIDER should be set to "supabase".');
}

export async function getConnection(): Promise<any> {
  throw new Error('MySQL is disabled. DATABASE_PROVIDER should be set to "supabase".');
}

export function initDB(): Promise<void> {
  return Promise.resolve();
}
