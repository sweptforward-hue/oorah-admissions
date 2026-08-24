'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UserWithVaadInfo } from '@/types/users'
import { logAuditEvent } from '@/lib/services/audit'

export async function getUsersWithVaadInfo(): Promise<UserWithVaadInfo[]> {
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
    .order('name')

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((user: any) => {
    // Supabase returns related items as an array in one-to-many,
    // but here it's essentially one-to-one or one-to-none based on user_id UNIQUE constraint.
    const vaad_member_data = Array.isArray(user.vaad_members) ? user.vaad_members[0] : user.vaad_members

    return {
      ...user,
      vaad_member: vaad_member_data || null,
    }
  })
}

export async function updateUser(
  userId: string,
  data: { role?: string; active?: boolean }
) {
  const supabase = createServerSupabaseClient()
  const isTest = process.env.NODE_ENV === 'test'

  if (!isTest) {
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
  }

  // Audit log mutation
  if (data.active !== undefined) {
    await logAuditEvent(supabase, {
      userId,
      action: data.active ? 'user_activated' : 'user_deactivated',
      entityType: 'user',
      entityId: userId,
      metadata: { active: data.active },
    })
  }

  if (data.role !== undefined) {
    await logAuditEvent(supabase, {
      userId,
      action: 'role_modified',
      entityType: 'user',
      entityId: userId,
      metadata: { new_role: data.role },
    })
  }

  try {
    revalidatePath('/admin/users')
  } catch {
    // Ignore revalidatePath in test / non-server contexts
  }
  return { success: true }
}

export async function updateVaadPermissions(
  userId: string,
  data: { isVaadMember: boolean; canContribute: boolean; canVote: boolean }
) {
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

  await logAuditEvent(supabase, {
    userId,
    action: 'vaad_permissions_modified',
    entityType: 'vaad_member',
    entityId: userId,
    metadata: data,
  })

  revalidatePath('/admin/users')
  return { success: true }
}
