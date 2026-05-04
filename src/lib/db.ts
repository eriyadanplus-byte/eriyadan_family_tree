// Database abstraction layer — always uses Supabase in production.
// The mysql-db module is kept as a no-op stub for build-time compatibility.

export { query } from './supabase-db';
