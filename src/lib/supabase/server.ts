import { createClient } from '@supabase/supabase-js'

export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  // Use service role for admin operations bypassing RLS
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key'

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
