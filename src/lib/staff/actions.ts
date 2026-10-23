'use server'

import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser, requireAdminRole } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'
import { StaffItem } from '@/types/staff'
import {
  getStoredStaff,
  saveStoredStaff,
  updateStoredStaff,
  deleteStoredStaff,
  PersistentStaff,
} from '@/lib/persistence/store'

export type { StaffItem }

export async function getStaffRoster(filter?: { session?: string; search?: string }): Promise<StaffItem[]> {
  let roster: StaffItem[] = []

  try {
    const supabase = await createServerSupabaseClient()
    let query = supabase.from('staff').select('*').order('created_at', { ascending: false })

    if (filter?.session && filter.session !== 'All' && filter.session !== 'All Sessions') {
      query = query.or(`session.eq.${filter.session},session.eq.All Sessions`)
    }

    if (filter?.search && filter.search.trim()) {
      const term = `%${filter.search.trim()}%`
      query = query.or(
        `first_name.ilike.${term},last_name.ilike.${term},name.ilike.${term},email.ilike.${term},application_number.ilike.${term},role_title.ilike.${term},bunk_assignment.ilike.${term}`
      )
    }

    const { data, error } = await query

    if (!error && data) {
      roster = (data || []).map((s: Record<string, unknown>) => ({
        id: String(s.id),
        application_number: String(s.application_number || `STF-${String(s.id).slice(0, 5)}`),
        first_name: String(s.first_name || ''),
        last_name: String(s.last_name || ''),
        name: String(s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Staff Member'),
        email: s.email ? String(s.email) : null,
        phone: s.phone ? String(s.phone) : null,
        role_title: String(s.role_title || 'Counselor'),
        department: String(s.department || 'Camp Operations'),
        status: String(s.status || 'Active'),
        session: s.session ? String(s.session) : 'All Sessions',
        year: Number(s.year || 2026),
        bunk_assignment: s.bunk_assignment ? String(s.bunk_assignment) : null,
        notes: s.notes ? String(s.notes) : null,
        created_at: String(s.created_at || new Date().toISOString()),
        updated_at: String(s.updated_at || new Date().toISOString()),
      }))
    }
  } catch (err) {
    console.warn('Could not query staff table from Supabase:', err)
  }

  // Merge server persistent store so created staff members persist 100% across refreshes
  try {
    const stored = getStoredStaff()
    for (const s of stored) {
      if (!roster.some((r) => r.id === s.id || r.application_number === s.application_number)) {
        roster.unshift({
          id: s.id,
          application_number: s.application_number,
          first_name: s.first_name,
          last_name: s.last_name,
          name: s.name,
          email: s.email || null,
          phone: s.phone || null,
          role_title: s.role_title,
          department: s.department,
          status: s.status,
          session: s.session,
          year: s.year,
          bunk_assignment: s.bunk_assignment || null,
          notes: s.notes || null,
          created_at: s.created_at,
          updated_at: s.updated_at,
        })
      }
    }
  } catch {}

  // Client-side filtering on merged list if filter parameters provided
  if (filter?.session && filter.session !== 'All' && filter.session !== 'All Sessions') {
    roster = roster.filter((s) => s.session === filter.session || s.session === 'All Sessions')
  }
  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase()
    roster = roster.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.first_name.toLowerCase().includes(q) ||
        s.last_name.toLowerCase().includes(q) ||
        s.application_number.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        s.role_title.toLowerCase().includes(q)
    )
  }

  return roster
}

export async function getStaffMember(id: string): Promise<StaffItem | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from('staff').select('*').eq('id', id).single()

    if (!error && data) {
      return {
        id: String(data.id),
        application_number: String(data.application_number || `STF-${String(data.id).slice(0, 5)}`),
        first_name: String(data.first_name || ''),
        last_name: String(data.last_name || ''),
        name: String(data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Staff Member'),
        email: data.email ? String(data.email) : null,
        phone: data.phone ? String(data.phone) : null,
        role_title: String(data.role_title || 'Counselor'),
        department: String(data.department || 'Camp Operations'),
        status: String(data.status || 'Active'),
        session: data.session ? String(data.session) : 'All Sessions',
        year: Number(data.year || 2026),
        bunk_assignment: data.bunk_assignment ? String(data.bunk_assignment) : null,
        notes: data.notes ? String(data.notes) : null,
        created_at: String(data.created_at || new Date().toISOString()),
        updated_at: String(data.updated_at || new Date().toISOString()),
      }
    }
  } catch {}

  // Fallback to local persistent store
  const stored = getStoredStaff().find((s) => s.id === id || s.application_number === id)
  if (stored) {
    return {
      id: stored.id,
      application_number: stored.application_number,
      first_name: stored.first_name,
      last_name: stored.last_name,
      name: stored.name,
      email: stored.email || null,
      phone: stored.phone || null,
      role_title: stored.role_title,
      department: stored.department,
      status: stored.status,
      session: stored.session,
      year: stored.year,
      bunk_assignment: stored.bunk_assignment || null,
      notes: stored.notes || null,
      created_at: stored.created_at,
      updated_at: stored.updated_at,
    }
  }

  return null
}

export async function createStaffMember(staffData: {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  role_title?: string
  department?: string
  session?: string
  year?: number
  bunk_assignment?: string
  notes?: string
}) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Authentication required')

    if (!staffData.first_name?.trim()) {
      return { success: false, error: 'First name is required' }
    }
    if (!staffData.last_name?.trim()) {
      return { success: false, error: 'Last name is required' }
    }

    if (staffData.email && staffData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(staffData.email.trim())) {
        return { success: false, error: 'Please enter a valid email address' }
      }
    }

    const appNum = `STF-${Math.floor(1000 + Math.random() * 9000)}`
    const nowIso = new Date().toISOString()
    const fallbackId = `stf-${Date.now()}`

    const payload = {
      application_number: appNum,
      first_name: staffData.first_name.trim(),
      last_name: staffData.last_name.trim(),
      email: staffData.email?.trim() || null,
      phone: staffData.phone?.trim() || null,
      role_title: staffData.role_title?.trim() || 'Counselor',
      department: staffData.department?.trim() || 'Camp Operations',
      session: staffData.session || 'Session A',
      year: staffData.year || 2026,
      bunk_assignment: staffData.bunk_assignment?.trim() || null,
      notes: staffData.notes?.trim() || null,
      status: 'Active',
    }

    let createdId = fallbackId
    try {
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase.from('staff').insert(payload).select().single()
      if (!error && data?.id) {
        createdId = data.id
      }
    } catch (sbErr) {
      console.warn('Supabase staff insert exception:', sbErr)
    }

    // Always persist to server-side persistent store so refresh retains data 100%
    const persistentRecord: PersistentStaff = {
      id: createdId,
      ...payload,
      name: `${payload.first_name} ${payload.last_name}`,
      created_at: nowIso,
      updated_at: nowIso,
    }
    saveStoredStaff(persistentRecord)

    // Safely record in audit trail
    try {
      const supabase = await createServerSupabaseClient()
      await supabase.from('audit_log').insert({
        actor_id: user.id,
        action: 'CREATE_STAFF_MEMBER',
        entity_type: 'staff',
        entity_id: createdId,
        details: { name: persistentRecord.name, app_number: appNum },
      })
    } catch {}

    revalidatePath('/staff')
    revalidatePath('/admin/staff')
    revalidatePath('/session-a/staff')
    revalidatePath('/session-b/staff')
    return { success: true, data: persistentRecord }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to create staff member' }
  }
}

export async function updateStaffMember(
  id: string,
  updates: Partial<{
    first_name: string
    last_name: string
    email: string
    phone: string
    role_title: string
    department: string
    status: string
    session: string
    year: number
    bunk_assignment: string
    notes: string
  }>
) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Authentication required')

    if (updates.email && updates.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(updates.email.trim())) {
        return { success: false, error: 'Please enter a valid email address' }
      }
    }

    // Try Supabase update
    try {
      const supabase = await createServerSupabaseClient()
      await supabase
        .from('staff')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    } catch {}

    // Update persistent local store
    updateStoredStaff(id, updates)

    try {
      const supabase = await createServerSupabaseClient()
      await supabase.from('audit_log').insert({
        actor_id: user.id,
        action: 'UPDATE_STAFF_MEMBER',
        entity_type: 'staff',
        entity_id: id,
        details: updates,
      })
    } catch {}

    revalidatePath('/staff')
    revalidatePath(`/staff/${id}`)
    revalidatePath('/admin/staff')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to update staff member' }
  }
}

export async function deleteStaffMember(staffId: string) {
  try {
    const admin = await requireAdminRole()
    const adminSupabase = createAdminClient()

    // Fetch staff name and bunk assignment for audit log before deletion
    let staffName = staffId
    let appNumber = ''
    const stored = getStoredStaff().find((s) => s.id === staffId || s.application_number === staffId)
    if (stored) {
      staffName = stored.name
      appNumber = stored.application_number
    }

    try {
      const { data: staff } = await adminSupabase
        .from('staff')
        .select('name, first_name, last_name, application_number, bunk_assignment, session')
        .eq('id', staffId)
        .maybeSingle()

      if (staff) {
        staffName = staff.name || `${staff.first_name} ${staff.last_name}`
        appNumber = staff.application_number
      }

      await Promise.allSettled([
        adminSupabase.from('bunk_assignments').delete().eq('staff_id', staffId),
        adminSupabase.from('staff').update({ bunk_assignment: null }).eq('id', staffId),
      ])

      await adminSupabase.from('staff').delete().eq('id', staffId)
    } catch {}

    // Always remove from local persistent store
    deleteStoredStaff(staffId)

    try {
      await adminSupabase.from('audit_log').insert({
        actor_id: admin.id,
        action: 'DELETE_STAFF_MEMBER',
        entity_type: 'staff',
        entity_id: staffId,
        details: {
          staff_name: staffName,
          application_number: appNumber,
        },
      })
    } catch {}

    revalidatePath('/staff')
    revalidatePath('/admin/staff')
    revalidatePath('/session-a/staff')
    revalidatePath('/session-b/staff')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Unauthorized: Admin privileges required to delete staff' }
  }
}
