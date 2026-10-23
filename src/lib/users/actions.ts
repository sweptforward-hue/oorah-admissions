'use server'

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UserWithVaadInfo } from '@/types/users'
import { requireAdminRole } from '@/lib/auth/authorization'

export async function getUsersWithVaadInfo(): Promise<UserWithVaadInfo[]> {
  await requireAdminRole()
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  )

  if (!hasSupabaseConfig && process.env.NODE_ENV !== 'test') {
    return []
  }

  const supabase = createServerSupabaseClient()

  // Left join to vaad_members
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      vaad_members (
        id,
        user_id,
        is_active,
        can_contribute,
        can_vote,
        created_at,
        updated_at
      )
    `)
    .order('email')

  if (error || !data || data.length === 0) {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((user: any) => {
    const vaad_member_data = Array.isArray(user.vaad_members) ? user.vaad_members[0] : user.vaad_members

    return {
      ...user,
      name: user.full_name || user.name || user.email?.split('@')[0] || 'User',
      vaad_member: vaad_member_data || null,
    }
  })
}

export async function updateUser(
  userId: string,
  data: { role?: string; active?: boolean }
) {
  await requireAdminRole()
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  )

  if (!hasSupabaseConfig) {
    revalidatePath('/admin/users')
    return { success: true }
  }

  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('users')
    .update({
      ...(data.role !== undefined && { role: data.role }),
      ...(data.active !== undefined && { active: data.active }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateVaadPermissions(
  userId: string,
  data: { isVaadMember: boolean; canContribute: boolean; canVote: boolean }
) {
  await requireAdminRole()
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  )

  if (!hasSupabaseConfig) {
    revalidatePath('/admin/users')
    return { success: true }
  }

  const supabase = createServerSupabaseClient()

  if (!data.isVaadMember) {
    // If not a VAAD member, set is_active to false in vaad_members table if it exists
    const { error } = await supabase
      .from('vaad_members')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) {
       console.error("Error updating vaad member", error)
    }

  } else {
    // Upsert the VAAD member row
    const { error } = await supabase
      .from('vaad_members')
      .upsert({
        user_id: userId,
        is_active: true,
        can_contribute: data.canContribute,
        can_vote: data.canVote,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  try {
    const admin = await requireAdminRole()
    const adminSupabase = createAdminClient()

    // Retrieve user metadata for audit logging
    const { data: user } = await adminSupabase
      .from('users')
      .select('email, full_name, role')
      .eq('id', userId)
      .maybeSingle()

    // 1. Remove associated VAAD seats and unlink staff profile
    await Promise.allSettled([
      adminSupabase.from('vaad_members').delete().eq('user_id', userId),
      adminSupabase.from('staff').update({ user_id: null }).eq('user_id', userId),
    ])

    // 2. Delete user account
    const { error } = await adminSupabase.from('users').delete().eq('id', userId)

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`)
    }

    // 3. Immutable audit log record
    await adminSupabase.from('audit_log').insert({
      actor_id: admin.id,
      action: 'DELETE_USER',
      entity_type: 'user',
      entity_id: userId,
      details: {
        email: user?.email,
        full_name: user?.full_name,
        role: user?.role,
      },
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Unauthorized: Admin privileges required to delete users' }
  }
}
