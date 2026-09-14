'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser, requireAdminRole } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'

export async function deleteCamper(camperId: string) {
  try {
    const admin = await requireAdminRole()
    const supabase = createServerSupabaseClient()

    // Fetch camper name/appNum for audit log before deletion
    const { data: camper } = await supabase.from('kids').select('name, application_number, first_name, last_name').eq('id', camperId).single()
    const camperName = camper ? (camper.name || `${camper.first_name} ${camper.last_name}`) : camperId

    const { error } = await supabase.from('kids').delete().eq('id', camperId)

    if (error) {
      return { success: false, error: `Failed to delete camper: ${error.message}` }
    }

    // Record immutable audit log entry
    await supabase.from('audit_log').insert({
      actor_id: admin.id,
      action: 'DELETE_CAMPER',
      entity_type: 'kid',
      entity_id: camperId,
      details: { camper_name: camperName }
    })

    revalidatePath('/admin/campers')
    revalidatePath('/campers')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Unauthorized: Admin role required' }
  }
}

export async function updateCamperStatus(camperId: string, newStatusName: string, reason: string) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    // Find status_id from public.statuses
    let statusId: string | null = null
    const { data: statusData } = await supabase.from('statuses').select('id').eq('name', newStatusName).single()
    if (statusData) {
      statusId = statusData.id
    } else {
      const { data: newStatus } = await supabase.from('statuses').insert({ name: newStatusName }).select('id').single()
      if (newStatus) statusId = newStatus.id
    }

    // Get current status_id
    const { data: currentKid } = await supabase.from('kids').select('status_id').eq('id', camperId).single()
    const oldStatusId = currentKid?.status_id || null

    const { error } = await supabase.from('kids').update({
      status_id: statusId,
      updated_at: new Date().toISOString()
    }).eq('id', camperId)

    if (error) {
      return { success: false, error: `Failed to update status: ${error.message}` }
    }

    if (statusId) {
      await supabase.from('status_history').insert({
        kid_id: camperId,
        old_status_id: oldStatusId,
        new_status_id: statusId,
        changed_by: actor.id,
        notes: reason
      })
    }

    await supabase.from('audit_log').insert({
      actor_id: actor.id,
      action: 'OVERRIDE_STATUS',
      entity_type: 'kid',
      entity_id: camperId,
      details: { new_status: newStatusName, reason }
    })

    revalidatePath('/admin/campers')
    revalidatePath(`/campers/${camperId}`)
    revalidatePath('/campers')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to update camper status' }
  }
}

export async function toggleCamperVoting(camperId: string, votingOpen: boolean) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from('kids').update({
      voting_open: votingOpen,
      updated_at: new Date().toISOString()
    }).eq('id', camperId)

    if (error) {
      return { success: false, error: `Failed to update voting status: ${error.message}` }
    }

    await supabase.from('audit_log').insert({
      actor_id: actor.id,
      action: votingOpen ? 'REOPEN_VOTING' : 'CLOSE_VOTING',
      entity_type: 'kid',
      entity_id: camperId,
      details: { voting_open: votingOpen }
    })

    revalidatePath('/admin/campers')
    revalidatePath(`/campers/${camperId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to update voting status' }
  }
}

export async function updateCamperProfile(
  camperId: string,
  profileData: {
    grade?: string
    school?: string
    city?: string
    state?: string
    gender?: string
    notes?: string
    name?: string
  }
) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const updatePayload: Record<string, any> = {
      ...profileData,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase.from('kids').update(updatePayload).eq('id', camperId)

    if (error) {
      return { success: false, error: `Failed to update camper profile: ${error.message}` }
    }

    await supabase.from('audit_log').insert({
      actor_id: actor.id,
      action: 'UPDATE_CAMPER_PROFILE',
      entity_type: 'kid',
      entity_id: camperId,
      details: profileData
    })

    revalidatePath(`/campers/${camperId}`)
    revalidatePath('/campers')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to update camper profile' }
  }
}

export async function assignCamperCohortBunk(
  camperId: string,
  sessionName: string,
  bunk: string
) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from('kids').update({
      session: sessionName,
      notes: `Assigned to ${sessionName}, Bunk: ${bunk}`,
      updated_at: new Date().toISOString()
    }).eq('id', camperId)

    if (error) {
      return { success: false, error: `Failed to assign cohort and bunk: ${error.message}` }
    }

    await supabase.from('audit_log').insert({
      actor_id: actor.id,
      action: 'ASSIGN_COHORT_BUNK',
      entity_type: 'kid',
      entity_id: camperId,
      details: { sessionName, bunk }
    })

    revalidatePath(`/campers/${camperId}`)
    revalidatePath('/campers')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to assign cohort and bunk' }
  }
}

export async function getAdminCampers() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('kids')
    .select(`
      id,
      name,
      application_number,
      created_at,
      voting_open,
      statuses (
        id,
        name,
        color_hex
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin campers:', error)
    return []
  }

  return (data || []).map((kid: any) => ({
    id: kid.id,
    name: kid.name,
    appNum: kid.application_number || `APP-${kid.id.slice(0, 5)}`,
    status: kid.statuses?.name || 'Pending',
    statusColor: kid.statuses?.color_hex || '#e2e8f0',
    votingOpen: kid.voting_open ?? true,
    createdDate: new Date(kid.created_at).toISOString().split('T')[0]
  }))
}
