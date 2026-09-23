'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

interface AuthUserMeta {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    name?: string
    avatar_url?: string
  }
}

export async function syncUserProfile(user: AuthUserMeta) {
  if (!user || !user.id) return null

  const supabase = createServerSupabaseClient()
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Staff Member'
  const avatarUrl = user.user_metadata?.avatar_url || null

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email || '',
        full_name: fullName,
        role: 'staff',
        active: true,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single()

  if (error) {
    console.error('Error syncing user profile:', error)
  }

  return data
}

export async function getCurrentUser() {
  const supabase = createServerSupabaseClient()

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

  if (!dbUser) {
    const synced = await syncUserProfile(user)
    if (synced) return synced
  }

  return dbUser || { id: user.id, role: 'staff', active: true, full_name: user.user_metadata?.full_name || 'Staff Member', email: user.email || '' }
}

export async function requireAdminRole() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin' || user.active === false) {
    throw new Error('Unauthorized: Admin role required')
  }
  return user
}
