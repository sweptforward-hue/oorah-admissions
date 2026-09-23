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
  const { data, error } = await supabase
    .from('custom_field_definitions')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching custom fields:', error)
    return []
  }

  return data || []
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
  const supabase = createServerSupabaseClient()

  const opts = {
    ...(fieldData.options || {}),
    entity_type: fieldData.entity_type || 'camper'
  }

  const { data, error } = await supabase
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

  if (error) {
    throw new Error(`Failed to create custom field: ${error.message}`)
  }

  revalidatePath('/admin/custom-fields')
  return data
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
