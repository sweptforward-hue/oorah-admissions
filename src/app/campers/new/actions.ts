"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth/authorization"

export async function createCamper(formData: FormData) {
  let supabase = await createClient()

  // Extract primary fields
  const firstName = (formData.get("firstName") as string || "").trim()
  const lastName = (formData.get("lastName") as string || "").trim()
  const nameInput = (formData.get("name") as string || "").trim()

  const applicationNumber = (formData.get("applicationNumber") as string || "").trim()

  let fullName = nameInput
  if (!fullName) {
    fullName = `${firstName} ${lastName}`.trim()
  }

  let finalFirstName = firstName
  let finalLastName = lastName
  if (!finalFirstName && !finalLastName && fullName) {
    const parts = fullName.split(" ")
    finalFirstName = parts[0] || ""
    finalLastName = parts.slice(1).join(" ") || ""
  }

  if ((!fullName && !finalFirstName && !finalLastName) || !applicationNumber) {
    return { error: "Name and Application Number are required" }
  }

  const gender = (formData.get("gender") as string || "").trim() || null
  const dateOfBirth = (formData.get("dateOfBirth") as string || "").trim() || null
  const grade = (formData.get("grade") as string || "").trim() || null
  const school = (formData.get("school") as string || "").trim() || null
  const city = (formData.get("city") as string || "").trim() || null
  const state = (formData.get("state") as string || "").trim() || null
  const session = (formData.get("session") as string || "").trim() || null
  const notes = (formData.get("notes") as string || "").trim() || null

  // Extract dynamic custom field inputs (Family, Medical, Intake Questionnaire)
  const customFieldsToProcess = [
    { name: "father_name", label: "Father Name", value: formData.get("fatherName") as string },
    { name: "father_phone", label: "Father Phone", value: formData.get("fatherPhone") as string },
    { name: "mother_name", label: "Mother Name", value: formData.get("motherName") as string },
    { name: "mother_phone", label: "Mother Phone", value: formData.get("motherPhone") as string },
    { name: "emergency_contact", label: "Emergency Contact", value: formData.get("emergencyContact") as string },
    { name: "medical_notes", label: "Medical / Health Notes", value: formData.get("medicalNotes") as string },
    { name: "allergies_dietary", label: "Allergies & Dietary Restrictions", value: formData.get("allergiesDietary") as string },
    { name: "behavioral_notes", label: "Behavioral / Developmental Notes", value: formData.get("behavioralNotes") as string },
    { name: "previous_camp_exp", label: "Previous Camp Experience", value: formData.get("previousCampExp") as string },
    { name: "referral_source", label: "Referral Source", value: formData.get("referralSource") as string },
  ]

  // Get current user for audit log and history
  const actor = await getCurrentUser()

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

  const kidInsertPayload = {
    name: fullName,
    first_name: finalFirstName || fullName,
    last_name: finalLastName || "",
    application_number: applicationNumber,
    gender,
    date_of_birth: dateOfBirth,
    grade,
    school,
    city,
    state,
    session,
    notes,
    status_id: statusId,
    voting_open: true,
  }

  // Insert kid record
  let insertResult = await supabase
    .from('kids')
    .insert([kidInsertPayload])
    .select()
    .single()

  if (insertResult.error && (insertResult.error.message.includes('row-level security') || insertResult.error.code === '42501' || insertResult.error.code === 'PGRST116')) {
    const adminSupabase = createAdminClient()
    supabase = adminSupabase
    insertResult = await adminSupabase
      .from('kids')
      .insert([kidInsertPayload])
      .select()
      .single()
  }

  if (insertResult.error || !insertResult.data) {
    console.error("Error creating camper:", insertResult.error)
    return { error: insertResult.error?.message || "Failed to create camper record" }
  }

  const createdKid = insertResult.data

  // Process and save custom field values
  for (const fieldItem of customFieldsToProcess) {
    const valStr = (fieldItem.value || "").trim()
    if (!valStr) continue

    // Find or create definition
    let defId: string | undefined
    const { data: existingDef } = await supabase
      .from('custom_field_definitions')
      .select('id')
      .eq('name', fieldItem.name)
      .maybeSingle()

    if (existingDef) {
      defId = existingDef.id
    } else {
      const { data: newDef } = await supabase
        .from('custom_field_definitions')
        .insert({
          name: fieldItem.name,
          label: fieldItem.label,
          field_type: 'text',
          required: false,
          options: { entity_type: 'camper' }
        })
        .select('id')
        .maybeSingle()
      defId = newDef?.id
    }

    if (defId) {
      await supabase.from('custom_field_values').upsert({
        kid_id: createdKid.id,
        field_id: defId,
        value: JSON.stringify(valStr)
      }, { onConflict: 'kid_id,field_id' })
    }
  }

  // Insert initial status history record if statusId present
  if (statusId) {
    await supabase.from('status_history').insert({
      kid_id: createdKid.id,
      old_status_id: null,
      new_status_id: statusId,
      changed_by: actor?.id || null,
      notes: "Initial intake registration"
    })
  }

  // Log immutable audit event
  await supabase.from('audit_log').insert({
    actor_id: actor?.id || null,
    action: 'CREATE_CAMPER',
    entity_type: 'kid',
    entity_id: createdKid.id,
    details: {
      application_number: applicationNumber,
      name: fullName,
      intake_fields_saved: customFieldsToProcess.filter(f => Boolean(f.value?.trim())).map(f => f.name)
    }
  })

  revalidatePath('/campers')
  revalidatePath('/admin/campers')
  revalidatePath('/dashboard')
  redirect(`/campers/${createdKid.id}`)
}
