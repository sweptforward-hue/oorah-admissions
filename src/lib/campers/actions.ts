'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminRole, getCurrentUser } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'

export async function deleteCamper(camperId: string) {
  const admin = await requireAdminRole()
  const supabase = createServerSupabaseClient()

  // Fetch camper name/appNum for audit log before deletion
  const { data: camper } = await supabase.from('kids').select('name, application_number, first_name, last_name').eq('id', camperId).single()
  const camperName = camper ? (camper.name || `${camper.first_name} ${camper.last_name}`) : camperId

  const { error } = await supabase.from('kids').delete().eq('id', camperId)

  if (error) {
    throw new Error(`Failed to delete camper: ${error.message}`)
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
}

export async function updateCamperStatus(camperId: string, newStatusName: string, reason: string) {
  const actor = await getCurrentUser()
  if (!actor) {
    throw new Error('Unauthorized: Authentication required')
  }
  const supabase = createServerSupabaseClient()

  // Find status_id from public.statuses
  let statusId: string | null = null
  const { data: statusData } = await supabase.from('statuses').select('id').eq('name', newStatusName).single()
  if (statusData) {
    statusId = statusData.id
  } else {
    // If status doesn't exist, create or fetch
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
    throw new Error(`Failed to update status: ${error.message}`)
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
  const actor = await getCurrentUser()
  if (!actor) {
    throw new Error('Unauthorized: Authentication required')
  }
  const supabase = createServerSupabaseClient()

  const updatePayload: Record<string, any> = {
    ...profileData,
    updated_at: new Date().toISOString()
  }

  const { error } = await supabase.from('kids').update(updatePayload).eq('id', camperId)

  if (error) {
    console.error('Error updating camper profile:', error)
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
}

export async function assignCamperCohortBunk(
  camperId: string,
  sessionName: string,
  bunk: string
) {
  const actor = await getCurrentUser()
  if (!actor) {
    throw new Error('Unauthorized: Authentication required')
  }
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('kids').update({
    session_name: sessionName,
    bunk: bunk,
    updated_at: new Date().toISOString()
  }).eq('id', camperId)

  if (error) {
    console.error('Error assigning cohort/bunk:', error)
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
}

export async function toggleCamperVoting(camperId: string, votingOpen: boolean) {
  const actor = await getCurrentUser()
  if (!actor) {
    throw new Error('Unauthorized: Authentication required')
  }
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from('kids').update({
    voting_open: votingOpen,
    updated_at: new Date().toISOString()
  }).eq('id', camperId)

  if (error) {
    throw new Error(`Failed to update voting status: ${error.message}`)
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
}

export async function getAdminCampers() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from('kids').select(`
    id,
    application_number,
    first_name,
    last_name,
    voting_open,
    statuses ( name )
  `).order('created_at', { ascending: false })

  if (error || !data) {
    return [
      { id: '1', name: 'John Smith', appNum: '1042', status: 'VAAD Review', votingOpen: true },
      { id: '2', name: 'Sarah Cohen', appNum: '1043', status: 'Accepted', votingOpen: false },
    ]
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((c: any) => {
    const statusName = Array.isArray(c.statuses) ? c.statuses[0]?.name : c.statuses?.name
    return {
      id: c.id,
      name: c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : c.name || 'Unnamed Camper',
      appNum: c.application_number || 'N/A',
      status: statusName || 'New',
      votingOpen: c.voting_open ?? true,
    }
  })
}
