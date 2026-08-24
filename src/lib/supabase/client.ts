import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

export function createBrowserClient() {
  return createSupabaseBrowserClient(supabaseUrl, supabaseKey)
}

export const supabase = createBrowserClient()
