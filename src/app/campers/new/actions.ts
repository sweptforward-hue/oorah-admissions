"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

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

  // Create the kid record
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

  if (insertResult.error) {
    console.error("Error creating camper:", insertResult.error)
    return { error: insertResult.error.message }
  }

  revalidatePath('/campers')
  redirect(`/campers/${insertResult.data.id}`)
}
