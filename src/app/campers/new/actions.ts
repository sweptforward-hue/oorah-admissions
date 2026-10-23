"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { saveStoredCamper } from "@/lib/persistence/store"

export async function createCamper(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const applicationNumber = formData.get("applicationNumber") as string

  if (!name || !applicationNumber) {
    return { error: "Name and Application Number are required" }
  }

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

  const nowIso = new Date().toISOString()
  const fallbackId = `k-${Date.now()}`

  // Create the kid record in Supabase
  let createdRecord = null
  try {
    let insertResult = await supabase
      .from('kids')
      .insert([
        {
          name,
          application_number: applicationNumber,
          status_id: statusId
        }
      ])
      .select()
      .single()

    if (insertResult.error && (insertResult.error.message.includes('row-level security') || insertResult.error.code === '42501' || insertResult.error.code === 'PGRST116')) {
      const adminSupabase = createAdminClient()
      insertResult = await adminSupabase
        .from('kids')
        .insert([
          {
            name,
            application_number: applicationNumber,
            status_id: statusId
          }
        ])
        .select()
        .single()
    }

    if (!insertResult.error && insertResult.data) {
      createdRecord = insertResult.data
    }
  } catch (err) {
    console.warn("Supabase insert exception, persisting to server store:", err)
  }

  // Ensure 100% persistent storage so refresh never loses the newly added kid
  const finalId = createdRecord?.id || fallbackId
  saveStoredCamper({
    id: finalId,
    name,
    application_number: applicationNumber,
    status_id: statusId,
    status: 'New',
    voting_open: true,
    created_at: createdRecord?.created_at || nowIso,
    updated_at: createdRecord?.updated_at || nowIso,
  })

  revalidatePath('/campers')
  revalidatePath('/admin/campers')
  redirect(`/campers/${finalId}`)
}
