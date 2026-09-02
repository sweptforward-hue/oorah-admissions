'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'
import { verifyDriveConnection, uploadFileToDrive } from '@/lib/google/drive'
import { generateCSVString } from '@/lib/exports/csv'
import { createGoogleSpreadsheet, ExportData } from '@/lib/google/sheets'

// VAAD Members
export async function toggleVaadMemberPermission(
  memberId: string,
  field: 'is_active' | 'can_contribute' | 'can_vote',
  value: boolean
) {
  await getCurrentUser()
  const supabase = createServerSupabaseClient()

  // Determine actual column name in vaad_members table
  // Table schema has active, can_vote. Some models use is_active.
  const updateData: Record<string, boolean | string> = {
    updated_at: new Date().toISOString()
  }

  if (field === 'is_active') {
    updateData.active = value
    updateData.is_active = value
  } else {
    updateData[field] = value
  }

  const { error } = await supabase
    .from('vaad_members')
    .update(updateData)
    .eq('id', memberId)

  if (error) {
    throw new Error(`Failed to update VAAD member permissions: ${error.message}`)
  }

  revalidatePath('/admin/vaad-members')
  return { success: true }
}

// Operational Years
export async function createYear(yearName: string) {
  await getCurrentUser()
  const supabase = createServerSupabaseClient()

  const yearNum = parseInt(yearName.replace(/\D/g, ''), 10) || new Date().getFullYear() + 1

  const { data, error } = await supabase
    .from('years')
    .insert({
      year: yearNum,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create year: ${error.message}`)
  }

  revalidatePath('/admin/years')
  return data
}

export async function updateYear(id: string, data: { year?: number; is_active?: boolean }) {
  await getCurrentUser()
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('years')
    .update({
      ...data
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update year: ${error.message}`)
  }

  revalidatePath('/admin/years')
  return { success: true }
}

// Camp Sessions
export async function createSession(sessionData: {
  name: string
  start_date: string
  end_date: string
}) {
  await getCurrentUser()
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      name: sessionData.name,
      start_date: sessionData.start_date,
      end_date: sessionData.end_date,
      active: true
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }

  revalidatePath('/admin/sessions')
  return data
}

export async function updateSessionSchedule(id: string, start_date: string, end_date: string) {
  await getCurrentUser()
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('sessions')
    .update({
      start_date,
      end_date
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update session schedule: ${error.message}`)
  }

  revalidatePath('/admin/sessions')
  return { success: true }
}

// Data Exports
export async function triggerExport(exportType: 'Sheets' | 'CSV' | 'Drive Archive') {
  const actor = await getCurrentUser()
  const actorId = actor?.id || null
  const supabase = createServerSupabaseClient()

  // 1. Fetch real application records from database
  const [{ data: kids }, { data: users }, { data: docs }, { data: votes }, { data: auditLogs }] = await Promise.all([
    supabase.from('kids').select('*').limit(100),
    supabase.from('users').select('*').limit(100),
    supabase.from('documents').select('*').limit(100),
    supabase.from('vaad_votes').select('*').limit(100),
    supabase.from('audit_log').select('*').limit(100)
  ])

  let generatedFileUrl = ''

  if (exportType === 'CSV') {
    const headers = ['ID', 'Application Number', 'Name', 'Status ID', 'Voting Open', 'Created At', 'Updated At']
    const csvContent = await generateCSVString(headers, kids || [])
    generatedFileUrl = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`
  } else if (exportType === 'Sheets') {
    const exportData: ExportData = {
      kids: kids || [],
      users: users || [],
      documents: docs || [],
      vaadVotes: votes || [],
      auditLogs: auditLogs || []
    }
    const sheetResult = await createGoogleSpreadsheet(`Oorah Admissions Export ${new Date().toISOString().substring(0, 10)}`, exportData)
    generatedFileUrl = sheetResult.spreadsheetUrl
  } else if (exportType === 'Drive Archive') {
    const headers = ['ID', 'Application Number', 'Name', 'Status ID', 'Voting Open', 'Created At', 'Updated At']
    const csvContent = await generateCSVString(headers, kids || [])
    const fileBuffer = Buffer.from(csvContent, 'utf-8')
    const driveFile = await uploadFileToDrive({
      fileBuffer,
      filename: `Admissions_Export_${Date.now()}.csv`,
      mimeType: 'text/csv'
    })
    generatedFileUrl = driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`
  }

  const { data, error } = await supabase
    .from('exports')
    .insert({
      type: exportType,
      status: 'completed',
      format: exportType === 'CSV' ? 'csv' : 'sheets',
      file_url: generatedFileUrl,
      requested_by: actorId
    })
    .select()
    .single()

  await supabase.from('audit_log').insert({
    actor_id: actorId,
    action: 'DATA_EXPORT',
    entity_type: 'export_job',
    entity_id: data?.id || String(Date.now()),
    details: { destination: exportType, file_url: generatedFileUrl }
  })

  if (error) {
    console.error('Export error:', error)
  }

  revalidatePath('/admin/exports')
  return { success: true, fileUrl: generatedFileUrl }
}

// Document Storage / Google Drive
export async function updateDriveFolder(folderId: string) {
  const actor = await getCurrentUser()
  const actorId = actor?.id || null
  const supabase = createServerSupabaseClient()

  await supabase.from('audit_log').insert({
    actor_id: actorId,
    action: 'UPDATE_STORAGE_FOLDER',
    entity_type: 'system_settings',
    details: { drive_folder_id: folderId }
  })

  revalidatePath('/admin/storage')
  return { success: true }
}

export async function testDriveConnection() {
  await getCurrentUser()
  return await verifyDriveConnection()
}
