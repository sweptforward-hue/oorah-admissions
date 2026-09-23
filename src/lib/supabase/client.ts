import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'

let browserClient: ReturnType<typeof createSSRBrowserClient> | null = null

export function createBrowserClient() {
  if (typeof window === 'undefined') {
    return createSSRBrowserClient(supabaseUrl, supabaseKey)
  }
  if (!browserClient) {
    browserClient = createSSRBrowserClient(supabaseUrl, supabaseKey)
  }
  return browserClient
}

export const supabase = createBrowserClient()
