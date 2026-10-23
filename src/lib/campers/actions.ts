'use server'

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser, requireAdminRole } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'
import { getStoredCampers, deleteStoredCamper } from '@/lib/persistence/store'

export async function deleteCamper(camperId: string) {
  try {
    const admin = await requireAdminRole()
    const adminSupabase = createAdminClient()

    // Fetch camper name/appNum for audit log before deletion
    const { data: camper } = await adminSupabase
      .from('kids')
      .select('name, application_number, first_name, last_name')
      .eq('id', camperId)
      .maybeSingle()

    const camperName = camper ? (camper.name || `${camper.first_name} ${camper.last_name}`) : camperId

    // Cleanly delete from dependent tables if cascade isn't configured in all environments
    await Promise.allSettled([
      adminSupabase.from('photos').delete().eq('kid_id', camperId),
      adminSupabase.from('kid_photos').delete().eq('kid_id', camperId),
      adminSupabase.from('documents').delete().eq('kid_id', camperId),
      adminSupabase.from('kid_documents').delete().eq('kid_id', camperId),
      adminSupabase.from('voice_notes').delete().eq('kid_id', camperId),
      adminSupabase.from('kid_voice_notes').delete().eq('kid_id', camperId),
      adminSupabase.from('transcripts').delete().eq('kid_id', camperId),
      adminSupabase.from('kid_transcripts').delete().eq('kid_id', camperId),
      adminSupabase.from('kid_contacts').delete().eq('kid_id', camperId),
      adminSupabase.from('contacts').delete().eq('kid_id', camperId),
      adminSupabase.from('kid_notes').delete().eq('kid_id', camperId),
      adminSupabase.from('notes').delete().eq('kid_id', camperId),
      adminSupabase.from('custom_field_values').delete().eq('kid_id', camperId),
      adminSupabase.from('kid_custom_fields').delete().eq('kid_id', camperId),
      adminSupabase.from('vaad_votes').delete().eq('kid_id', camperId),
      adminSupabase.from('status_history').delete().eq('kid_id', camperId),
      adminSupabase.from('chat_messages').delete().eq('kid_id', camperId),
      adminSupabase.from('messages').delete().eq('kid_id', camperId),
    ])

    const { error } = await adminSupabase.from('kids').delete().eq('id', camperId)

    if (error) {
      return { success: false, error: `Failed to delete camper: ${error.message}` }
    }

    // Record immutable audit log entry
    await adminSupabase.from('audit_log').insert({
      actor_id: admin.id,
      action: 'DELETE_CAMPER',
      entity_type: 'kid',
      entity_id: camperId,
      details: {
        camper_name: camperName,
        application_number: camper?.application_number,
      }
    })

    // Also remove from local persistent store
    deleteStoredCamper(camperId)

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

    const hasSupabaseConfig = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
    )
    if (!hasSupabaseConfig) {
      revalidatePath('/admin/campers')
      revalidatePath(`/campers/${camperId}`)
      revalidatePath('/campers')
      return { success: true }
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

    const updatePayload: Record<string, unknown> = {
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

    const { data: currentKid } = await supabase.from('kids').select('notes').eq('id', camperId).maybeSingle()
    const assignmentText = `Assigned to ${sessionName}, Bunk: ${bunk}`
    const updatedNotes = currentKid?.notes ? `${currentKid.notes}\n${assignmentText}` : assignmentText

    let { error } = await supabase.from('kids').update({
      session: sessionName,
      bunk: bunk,
      notes: updatedNotes,
      updated_at: new Date().toISOString()
    }).eq('id', camperId)

    if (error && (error.message.includes("'notes'") || error.message.includes("'bunk'"))) {
      const res = await supabase.from('kids').update({
        session: sessionName,
        updated_at: new Date().toISOString()
      }).eq('id', camperId)
      error = res.error
    }

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
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
  )
  if (!hasSupabaseConfig) {
    return []
  }

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

  let resultList = (data || []).map((kid: any) => {
    const rawStatus = (kid as { statuses?: unknown }).statuses
    const statusObj = Array.isArray(rawStatus)
      ? (rawStatus[0] as { name?: string; color_hex?: string } | undefined)
      : (rawStatus as { name?: string; color_hex?: string } | undefined)
    return {
      id: String(kid.id),
      name: String(kid.name),
      appNum: kid.application_number || `APP-${String(kid.id).slice(0, 5)}`,
      status: statusObj?.name || 'Pending',
      statusColor: statusObj?.color_hex || '#e2e8f0',
      votingOpen: kid.voting_open ?? true,
      createdDate: new Date(kid.created_at).toISOString().split('T')[0]
    }
  })

  // Merge locally stored persistent campers so added campers persist after refresh
  try {
    const stored = getStoredCampers()
    for (const s of stored) {
      if (!resultList.some(r => r.id === s.id || r.appNum === s.application_number)) {
        resultList.unshift({
          id: s.id,
          name: s.name,
          appNum: s.application_number,
          status: s.status || 'New',
          statusColor: '#3b82f6',
          votingOpen: s.voting_open ?? true,
          createdDate: new Date(s.created_at).toISOString().split('T')[0]
        })
      }
    }
  } catch {}

  return resultList
}
