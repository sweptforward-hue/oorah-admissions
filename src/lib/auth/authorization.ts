'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // In local development / test without active Supabase Auth session:
    if (process.env.NODE_ENV === 'test') {
      const { data: dbUser } = await supabase.from('users').select('*').limit(1).single()
      if (dbUser) return dbUser
      return { id: '00000000-0000-0000-0000-000000000000', role: 'admin', active: true, full_name: 'Master Admin', email: 'admin@oorah.org' }
    }
    return null
  }

  const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single()
  return dbUser || { id: user.id, role: 'staff', active: true, full_name: 'Staff Member', email: user.email || '' }
}

export async function requireAdminRole() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin' || user.active === false) {
    throw new Error('Unauthorized: Admin role required')
  }
  return user
}
