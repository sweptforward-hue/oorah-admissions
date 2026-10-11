"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function createCamper(formData: FormData) {
  const supabase = await createClient()

  const rawName = formData.get("name") as string
  const rawApplicationNumber = formData.get("applicationNumber") as string

  const name = rawName ? rawName.trim() : ""
  const applicationNumber = rawApplicationNumber ? rawApplicationNumber.trim() : ""

  if (!name || !applicationNumber) {
    return { error: "Name and Application Number are required" }
  }

  const nameParts = name.split(/\s+/)
  const firstName = nameParts[0] || name
  const lastName = nameParts.slice(1).join(" ") || firstName

  let userId: string | null = null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id || null
  } catch {}

  // First get the default status ID (usually 'New')
  let statusId: string | undefined
  try {
    const { data: statusData } = await supabase
      .from('statuses')
      .select('id')
      .eq('name', 'New')
      .maybeSingle()

    statusId = statusData?.id

    if (!statusId) {
      const { data: anyStatus } = await supabase
        .from('statuses')
        .select('id')
        .limit(1)
        .maybeSingle()
      statusId = anyStatus?.id
    }
  } catch {}

  const payload = {
    name,
    first_name: firstName,
    last_name: lastName,
    application_number: applicationNumber,
    status_id: statusId
  }

  // Create the kid record
  let insertResult = await supabase
    .from('kids')
    .insert([payload])
    .select()
    .single()

  if (insertResult.error && (insertResult.error.message.includes('row-level security') || insertResult.error.code === '42501' || insertResult.error.code === 'PGRST116')) {
    const adminSupabase = createAdminClient()
    insertResult = await adminSupabase
      .from('kids')
      .insert([payload])
      .select()
      .single()
  }

  if (insertResult.error) {
    console.error("Error creating camper:", insertResult.error)
    return { error: insertResult.error.message }
  }

  const kidId = insertResult.data.id

  // Insert initial status history record if statusId present
  if (statusId && kidId) {
    try {
      await supabase.from('status_history').insert({
        kid_id: kidId,
        new_status_id: statusId,
        changed_by: userId,
        notes: 'Initial registration'
      })
    } catch (e) {
      console.error("Error creating initial status history:", e)
    }
  }

  // Insert audit log entry
  if (kidId) {
    try {
      await supabase.from('audit_log').insert({
        actor_id: userId,
        action: 'CREATE_CAMPER',
        entity_type: 'kid',
        entity_id: kidId,
        details: { name, application_number: applicationNumber }
      })
    } catch (e) {
      console.error("Error recording audit log for new camper:", e)
    }
  }

  revalidatePath('/campers')
  revalidatePath('/dashboard')
  revalidatePath('/admin/campers')
  redirect(`/campers/${kidId}`)
}
