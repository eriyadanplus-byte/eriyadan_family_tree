import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

let _client: SupabaseClient | null = null
const getClient = (): SupabaseClient => (_client ??= createClient())

export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getClient()
    const val = (client as any)[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})