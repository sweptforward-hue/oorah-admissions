'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminRole } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'

export interface ClientCategory {
  id: string
  name: string
  code: string | null
  description: string | null
  color: string
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export async function getClientCategories(includeInactive = false): Promise<ClientCategory[]> {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  )

  if (!hasSupabaseConfig && process.env.NODE_ENV !== 'test') {
    return []
  }

  try {
    const supabase = createServerSupabaseClient()
    let query = supabase
      .from('client_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      return []
    }

    return data
  } catch (err) {
    console.error('Error fetching client categories:', err)
    return []
  }
}

export async function getAllClientCategories(): Promise<ClientCategory[]> {
  return getClientCategories(true)
}

export async function createClientCategory(data: {
  name: string
  code?: string
  description?: string
  color?: string
}) {
  const admin = await requireAdminRole()
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  )

  const categoryName = data.name.trim()
  const categoryCode = data.code ? data.code.trim() : null
  const categoryDesc = data.description ? data.description.trim() : null
  const categoryColor = data.color || '#3b82f6'

  if (!hasSupabaseConfig) {
    const newCategory: ClientCategory = {
      id: String(Date.now()),
      name: categoryName,
      code: categoryCode,
      description: categoryDesc,
      color: categoryColor,
      is_active: true,
      sort_order: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    revalidatePath('/admin/client-categories')
    return newCategory
  }

  const supabase = createServerSupabaseClient()

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('client_categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1

  const { data: created, error } = await supabase
    .from('client_categories')
    .insert({
      name: categoryName,
      code: categoryCode,
      description: categoryDesc,
      color: categoryColor,
      is_active: true,
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create client category: ${error.message}`)
  }

  // Audit log entry
  await supabase.from('audit_log').insert({
    actor_id: admin.id,
    action: 'CREATE_CLIENT_CATEGORY',
    entity_type: 'client_category',
    entity_id: created.id,
    details: {
      name: created.name,
      code: created.code,
      color: created.color,
    },
  })

  revalidatePath('/admin/client-categories')
  return created
}

export async function updateClientCategory(
  id: string,
  data: Partial<{
    name: string
    code?: string
    description?: string
    color?: string
    is_active: boolean
    sort_order: number
  }>
) {
  const admin = await requireAdminRole()
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  )

  if (!hasSupabaseConfig) {
    revalidatePath('/admin/client-categories')
    return { id, ...data }
  }

  const supabase = createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (data.name !== undefined) updatePayload.name = data.name.trim()
  if (data.code !== undefined) updatePayload.code = data.code ? data.code.trim() : null
  if (data.description !== undefined) updatePayload.description = data.description ? data.description.trim() : null
  if (data.color !== undefined) updatePayload.color = data.color
  if (data.is_active !== undefined) updatePayload.is_active = data.is_active
  if (data.sort_order !== undefined) updatePayload.sort_order = data.sort_order

  const { data: updated, error } = await supabase
    .from('client_categories')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update client category: ${error.message}`)
  }

  // Audit log entry
  await supabase.from('audit_log').insert({
    actor_id: admin.id,
    action: 'UPDATE_CLIENT_CATEGORY',
    entity_type: 'client_category',
    entity_id: id,
    details: data,
  })

  revalidatePath('/admin/client-categories')
  return updated
}

export async function deleteClientCategory(id: string) {
  const admin = await requireAdminRole()
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  )

  if (!hasSupabaseConfig) {
    revalidatePath('/admin/client-categories')
    return { success: true }
  }

  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('client_categories')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete client category: ${error.message}`)
  }

  // Audit log entry
  await supabase.from('audit_log').insert({
    actor_id: admin.id,
    action: 'DELETE_CLIENT_CATEGORY',
    entity_type: 'client_category',
    entity_id: id,
    details: { deleted_at: new Date().toISOString() },
  })

  revalidatePath('/admin/client-categories')
  return { success: true }
}
