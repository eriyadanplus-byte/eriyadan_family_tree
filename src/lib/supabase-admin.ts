import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazily initialized to avoid module-level throw in edge runtime
let _client: SupabaseClient | null = null;

// Server-only client that bypasses RLS — never import this in client components
export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  _client = createClient(url, serviceKey);
  return _client;
}
