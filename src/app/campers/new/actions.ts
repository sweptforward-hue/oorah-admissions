"use server"

import { createClient } from "@/lib/supabase/server"
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
  const { data: statusData } = await supabase
    .from('statuses')
    .select('id')
    .eq('name', 'New')
    .single()

  let statusId = statusData?.id

  // If 'New' status isn't found, try getting the first one
  if (!statusId) {
    const { data: anyStatus } = await supabase
      .from('statuses')
      .select('id')
      .limit(1)
      .single()
    statusId = anyStatus?.id
  }

  // Create the kid record
  const { data, error } = await supabase
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

  if (error) {
    console.error("Error creating camper:", error)
    return { error: error.message }
  }

  // Optionally log creation in audit log
  // ...

  revalidatePath('/campers')
  redirect(`/campers/${data.id}`)
}
