import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key'

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const createServerSupabaseClient = createAdminClient
