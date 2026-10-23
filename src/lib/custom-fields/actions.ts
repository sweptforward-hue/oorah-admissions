'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminRole } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'

export interface CustomFieldDefinition {
  id: string
  name: string
  label: string
  field_type: string
  required: boolean
  options?: Record<string, unknown>
  created_at?: string
}

export async function getCustomFields(): Promise<CustomFieldDefinition[]> {
  const supabase = createServerSupabaseClient()
  
  // Try querying canonical custom_fields table first
  let { data, error } = await supabase
    .from('custom_fields')
    .select('*')
    .order('created_at', { ascending: true })

  if (error || !data || data.length === 0) {
    const fallback = await supabase
      .from('custom_field_definitions')
      .select('*')
      .order('created_at', { ascending: true })
    data = fallback.data
    error = fallback.error
  }

  if (error || !data) {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => ({
    id: String(item.id),
    name: item.name || '',
    label: item.description || item.label || item.name || '',
    field_type: item.field_type || 'text',
    required: Boolean(item.is_required ?? item.required ?? false),
    options: item.options || {},
    created_at: item.created_at || new Date().toISOString()
  }))
}

export async function createCustomField(fieldData: {
  name: string
  label: string
  field_type: string
  required: boolean
  entity_type?: string
  options?: Record<string, unknown>
}) {
  await requireAdminRole()
  const opts = {
    ...(fieldData.options || {}),
    entity_type: fieldData.entity_type || 'camper'
  }

  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  )

  if (!hasSupabaseConfig) {
    const newField: CustomFieldDefinition = {
      id: String(Date.now()),
      name: fieldData.name.toLowerCase().replace(/\s+/g, '_'),
      label: fieldData.label,
      field_type: fieldData.field_type,
      required: fieldData.required,
      options: opts,
      created_at: new Date().toISOString()
    }
    revalidatePath('/admin/custom-fields')
    return newField
  }

  const supabase = createServerSupabaseClient()

  // Try custom_fields first
  let insertResult = await supabase
    .from('custom_fields')
    .insert({
      name: fieldData.name,
      description: fieldData.label,
      field_type: fieldData.field_type,
      is_required: fieldData.required,
      is_active: true,
      entity_type: fieldData.entity_type || 'camper',
      options: opts,
    })
    .select()
    .single()

  if (insertResult.error) {
    insertResult = await supabase
      .from('custom_field_definitions')
      .insert({
        name: fieldData.name.toLowerCase().replace(/\s+/g, '_'),
        label: fieldData.label,
        field_type: fieldData.field_type,
        required: fieldData.required,
        options: opts,
      })
      .select()
      .single()
  }

  if (insertResult.error) {
    throw new Error(`Failed to create custom field: ${insertResult.error.message}`)
  }

  revalidatePath('/admin/custom-fields')
  return insertResult.data
}

export async function updateCustomField(
  id: string,
  fieldData: {
    label?: string
    field_type?: string
    required?: boolean
    options?: Record<string, unknown>
  }
) {
  await requireAdminRole()
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  )

  if (!hasSupabaseConfig) {
    revalidatePath('/admin/custom-fields')
    return { id, ...fieldData, name: 'field_' + id }
  }

  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('custom_field_definitions')
    .update({
      ...(fieldData.label && { label: fieldData.label }),
      ...(fieldData.field_type && { field_type: fieldData.field_type }),
      ...(fieldData.required !== undefined && { required: fieldData.required }),
      ...(fieldData.options && { options: fieldData.options }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update custom field: ${error.message}`)
  }

  revalidatePath('/admin/custom-fields')
  return data
}

export async function deleteCustomField(id: string) {
  const admin = await requireAdminRole()
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
  )

  if (!hasSupabaseConfig) {
    revalidatePath('/admin/custom-fields')
    return { success: true }
  }

  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('custom_field_definitions')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete custom field: ${error.message}`)
  }

  await supabase.from('audit_log').insert({
    actor_id: admin.id,
    action: 'DELETE_CUSTOM_FIELD',
    entity_type: 'custom_field_definition',
    entity_id: id,
  })

  revalidatePath('/admin/custom-fields')
  return { success: true }
}
