// Database abstraction layer — switches between MySQL (dev) and Supabase (prod)
// based on the DATABASE_PROVIDER environment variable.
// Uses require() so only the selected backend module is loaded at runtime.

export const query: (sql: string, params?: any[]) => Promise<any> =
  process.env.DATABASE_PROVIDER === 'supabase'
    ? require('./supabase-db').query
    : require('./mysql-db').query;
