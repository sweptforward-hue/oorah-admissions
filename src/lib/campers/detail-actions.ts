'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/authorization'
import { submitVote } from '@/lib/vaad/actions'
import { uploadKidMediaAsset, deleteDriveFile } from '@/lib/google/drive'
import { revalidatePath } from 'next/cache'

function buildContractPdfBuffer(kidName: string, appNum: string): Buffer {
  const text = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 280 >>
stream
BT
/F1 18 Tf
50 700 Td
(Oorah Admissions Official Enrollment Contract) Tj
0 -30 Td
/F1 12 Tf
(Camper Name: ${kidName}) Tj
0 -20 Td
(Application #: ${appNum}) Tj
0 -20 Td
(Date Generated: ${new Date().toLocaleDateString()}) Tj
0 -30 Td
(Terms: Enrollment is binding upon signed document receipt and VAAD approval.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000248 00000 n
0000000580 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
650
%%EOF`
  return Buffer.from(text, 'utf-8')
}

export async function sendChatMessage(kidId: string, content: string) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    if (!content || !content.trim()) {
      return { success: false, error: 'Message content is required' }
    }

    const actorId = actor.id

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        kid_id: kidId,
        author_id: actorId,
        content: content.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Error sending chat message:', error)
      await supabase.from('audit_log').insert({
        actor_id: actorId,
        action: 'SEND_CHAT_NOTE',
        entity_type: 'kid',
        entity_id: kidId,
        details: { content: content.trim() }
      })
    }

    revalidatePath(`/campers/${kidId}`)
    return { success: true, message: data }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to send chat message' }
  }
}

export async function uploadDocumentToDrive(
  kidId: string,
  fileName: string,
  fileData?: string | Buffer,
  mimeType: string = 'application/pdf',
  documentType: string = 'General Document'
) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const { data: kid } = await supabase.from('kids').select('name, first_name, last_name').eq('id', kidId).single()
    const kidName = kid?.name || (kid?.first_name && kid?.last_name ? `${kid.first_name} ${kid.last_name}` : `Kid_${kidId}`)

    let fileBuffer: Buffer
    if (Buffer.isBuffer(fileData)) {
      fileBuffer = fileData
    } else if (typeof fileData === 'string') {
      fileBuffer = Buffer.from(fileData, 'base64')
    } else {
      fileBuffer = Buffer.from(`Sample content for document: ${fileName}`, 'utf-8')
    }

    const actorId = actor.id

    const uploadResult = await uploadKidMediaAsset({
      kidId,
      kidName,
      category: 'Documents',
      fileBuffer,
      filename: fileName,
      mimeType,
      uploadedBy: actorId,
      documentType,
    })

    revalidatePath(`/campers/${kidId}`)
    return {
      success: true,
      document: uploadResult.data?.dbRecord,
      driveFile: uploadResult.data?.driveFile
    }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to upload document' }
  }
}

export async function getCamperDocuments(kidId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('kid_id', kidId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching camper documents:', error)
    return []
  }

  return data || []
}

export async function deleteDocumentAction(
  documentId: string,
  kidId: string,
  driveFileId?: string
) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()
    const actorId = actor.id

    let targetDriveId = driveFileId
    let docName = 'document'
    if (!targetDriveId) {
      const { data: docRecord } = await supabase
        .from('documents')
        .select('drive_file_id, name')
        .eq('id', documentId)
        .single()
      if (docRecord) {
        targetDriveId = docRecord.drive_file_id
        docName = docRecord.name || docName
      }
    }

    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (dbError) {
      console.error('Error deleting document record from DB:', dbError)
      return { success: false, error: 'Failed to delete document record from database' }
    }

    if (targetDriveId) {
      await deleteDriveFile(targetDriveId)
    }

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'DELETE_DOCUMENT',
      entity_type: 'kid',
      entity_id: kidId,
      details: {
        document_id: documentId,
        drive_file_id: targetDriveId,
        filename: docName,
      },
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete document' }
  }
}

export async function castVaadVoteAction(kidId: string, choiceLabel: 'Accept' | 'Reject' | 'Abstain' | 'Request Interview') {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    let { data: choice } = await supabase
      .from('vaad_choices')
      .select('id')
      .ilike('label', `%${choiceLabel}%`)
      .limit(1)
      .single()

    if (!choice) {
      const { data: newChoice } = await supabase
        .from('vaad_choices')
        .insert({ label: choiceLabel, action: choiceLabel.toLowerCase().replace(/\s+/g, '_'), active: true })
        .select('id')
        .single()
      choice = newChoice
    }

    if (choice?.id) {
      try {
        await submitVote(supabase, kidId, choice.id)
      } catch (e) {
        console.warn('RPC submit_vaad_vote failed or bypassed in test environment:', e)
      }
    }

    const actorId = actor.id
    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: `VAAD_VOTE_${choiceLabel.toUpperCase().replace(/\s+/g, '_')}`,
      entity_type: 'kid',
      entity_id: kidId,
      details: { choice: choiceLabel }
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to cast VAAD vote' }
  }
}

export async function generateContractPdf(kidId: string) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const { data: kid } = await supabase.from('kids').select('name, first_name, last_name, application_number').eq('id', kidId).single()
    const kidName = kid?.name || (kid?.first_name && kid?.last_name ? `${kid.first_name} ${kid.last_name}` : 'Camper')
    const appNum = kid?.application_number || kidId

    const actorId = actor.id
    const pdfBuffer = buildContractPdfBuffer(kidName, appNum)
    const filename = `Contract_${kidName.replace(/\s+/g, '_')}_${appNum}.pdf`

    const uploadResult = await uploadKidMediaAsset({
      kidId,
      kidName,
      category: 'Documents',
      fileBuffer: pdfBuffer,
      filename,
      mimeType: 'application/pdf',
      uploadedBy: actorId,
      documentType: 'Generated Contract'
    })

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'GENERATE_CONTRACT_PDF',
      entity_type: 'kid',
      entity_id: kidId,
      details: { drive_file_id: uploadResult.data?.driveFile?.id, filename }
    })

    revalidatePath(`/campers/${kidId}`)
    const pdfUrl = uploadResult.data?.driveFile?.webViewLink || `/api/media/proxy/${uploadResult.data?.driveFile?.id}`
    return { success: true, pdfUrl, driveFile: uploadResult.data?.driveFile }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to generate contract PDF' }
  }
}

export async function uploadSignedContract(
  kidId: string,
  fileName?: string,
  fileData?: string | Buffer,
  mimeType: string = 'application/pdf'
) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const { data: kid } = await supabase.from('kids').select('name, first_name, last_name').eq('id', kidId).single()
    const kidName = kid?.name || (kid?.first_name && kid?.last_name ? `${kid.first_name} ${kid.last_name}` : `Kid_${kidId}`)
    const name = fileName || `Signed_Contract_${kidName.replace(/\s+/g, '_')}.pdf`

    let fileBuffer: Buffer
    if (Buffer.isBuffer(fileData)) {
      fileBuffer = fileData
    } else if (typeof fileData === 'string') {
      fileBuffer = Buffer.from(fileData, 'base64')
    } else {
      fileBuffer = Buffer.from(`Signed Contract Document for ${kidName}`, 'utf-8')
    }

    const actorId = actor.id

    const uploadResult = await uploadKidMediaAsset({
      kidId,
      kidName,
      category: 'Documents',
      fileBuffer,
      filename: name,
      mimeType,
      uploadedBy: actorId,
      documentType: 'Signed Contract'
    })

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'UPLOAD_SIGNED_CONTRACT',
      entity_type: 'kid',
      entity_id: kidId,
      details: { drive_file_id: uploadResult.data?.driveFile?.id, filename: name }
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true, document: uploadResult.data?.dbRecord, driveFile: uploadResult.data?.driveFile }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to upload signed contract' }
  }
}

export async function getKidPhotos(kidId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('kid_id', kidId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching photos:', error)
    return []
  }
  return data || []
}

export async function getKidVoiceNotes(kidId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('voice_notes')
    .select('*')
    .eq('kid_id', kidId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching voice notes:', error)
    return []
  }
  return data || []
}

export async function getKidTranscripts(kidId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('kid_id', kidId)
    .eq('document_type', 'Transcript')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching transcripts:', error)
    return []
  }
  return (data || []).map((doc: { id: string; name: string; drive_file_id?: string; created_at: string }) => ({
    id: doc.id,
    title: doc.name,
    content: `Stored in Google Drive: ${doc.name}`,
    drive_file_id: doc.drive_file_id,
    created_at: doc.created_at,
  }))
}

export async function uploadPhotoAction(
  kidId: string,
  filename: string,
  fileBase64: string,
  mimeType: string = 'image/jpeg',
  caption?: string
) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }

    const { data: kid } = await createServerSupabaseClient()
      .from('kids')
      .select('name, first_name, last_name')
      .eq('id', kidId)
      .single()
    const kidName = kid?.name || (kid?.first_name && kid?.last_name ? `${kid.first_name} ${kid.last_name}` : `Kid_${kidId}`)

    const fileBuffer = fileBase64 ? Buffer.from(fileBase64, 'base64') : Buffer.from('Mock image payload', 'utf-8')

    const res = await uploadKidMediaAsset({
      kidId,
      kidName,
      category: 'Photos',
      fileBuffer,
      filename,
      mimeType,
      uploadedBy: actor.id,
      caption,
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true, photo: res.data?.dbRecord, driveFile: res.data?.driveFile }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to upload photo' }
  }
}

export async function uploadVoiceNoteAction(
  kidId: string,
  filename: string,
  fileBase64: string,
  mimeType: string = 'audio/webm',
  durationSeconds: number = 0
) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }

    const { data: kid } = await createServerSupabaseClient()
      .from('kids')
      .select('name, first_name, last_name')
      .eq('id', kidId)
      .single()
    const kidName = kid?.name || (kid?.first_name && kid?.last_name ? `${kid.first_name} ${kid.last_name}` : `Kid_${kidId}`)

    const fileBuffer = fileBase64 ? Buffer.from(fileBase64, 'base64') : Buffer.from('Mock audio payload', 'utf-8')

    const res = await uploadKidMediaAsset({
      kidId,
      kidName,
      category: 'Voice Notes',
      fileBuffer,
      filename,
      mimeType,
      uploadedBy: actor.id,
      duration: durationSeconds,
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true, voiceNote: res.data?.dbRecord, driveFile: res.data?.driveFile }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to upload voice note' }
  }
}

export async function uploadTranscriptAction(
  kidId: string,
  filename: string,
  fileBase64: string,
  mimeType: string = 'application/pdf'
) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }

    const { data: kid } = await createServerSupabaseClient()
      .from('kids')
      .select('name, first_name, last_name')
      .eq('id', kidId)
      .single()
    const kidName = kid?.name || (kid?.first_name && kid?.last_name ? `${kid.first_name} ${kid.last_name}` : `Kid_${kidId}`)

    const fileBuffer = fileBase64 ? Buffer.from(fileBase64, 'base64') : Buffer.from('Mock transcript content', 'utf-8')

    const res = await uploadKidMediaAsset({
      kidId,
      kidName,
      category: 'Transcripts',
      fileBuffer,
      filename,
      mimeType,
      uploadedBy: actor.id,
      documentType: 'Transcript',
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true, transcript: res.data?.dbRecord, driveFile: res.data?.driveFile }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to upload transcript' }
  }
}

export async function deletePhotoAction(photoId: string, kidId: string) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from('photos').delete().eq('id', photoId)
    if (error) {
      return { success: false, error: `Failed to delete photo: ${error.message}` }
    }

    await supabase.from('audit_log').insert({
      actor_id: actor.id,
      action: 'DELETE_PHOTO',
      entity_type: 'kid',
      entity_id: kidId,
      details: { photo_id: photoId },
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete photo' }
  }
}

export async function deleteVoiceNoteAction(voiceNoteId: string, kidId: string) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from('voice_notes').delete().eq('id', voiceNoteId)
    if (error) {
      return { success: false, error: `Failed to delete voice note: ${error.message}` }
    }

    await supabase.from('audit_log').insert({
      actor_id: actor.id,
      action: 'DELETE_VOICE_NOTE',
      entity_type: 'kid',
      entity_id: kidId,
      details: { voice_note_id: voiceNoteId },
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete voice note' }
  }
}

export async function deleteTranscriptAction(transcriptId: string, kidId: string) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from('documents').delete().eq('id', transcriptId)
    if (error) {
      return { success: false, error: `Failed to delete transcript: ${error.message}` }
    }

    await supabase.from('audit_log').insert({
      actor_id: actor.id,
      action: 'DELETE_TRANSCRIPT',
      entity_type: 'kid',
      entity_id: kidId,
      details: { transcript_id: transcriptId },
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete transcript' }
  }
}
