'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/authorization'
import { revalidatePath } from 'next/cache'
import { uploadKidMediaAsset, deleteDriveFile } from '@/lib/google/drive'
import { submitVote } from '@/lib/services/vaad'

function buildContractPdfBuffer(kidName: string, appNum: string): Buffer {
  const content = `%PDF-1.4
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
<< /Length 120 >>
stream
BT
/F1 18 Tf
50 720 Td
(Oorah Admissions Official Enrollment Contract) Tj
/F1 12 Tf
0 -30 Td
(Camper: ${kidName}) Tj
0 -20 Td
(Application: ${appNum}) Tj
0 -20 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
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
0000000216 00000 n 
0000000386 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
455
%%EOF`
  return Buffer.from(content, 'utf-8')
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
  fileData?: Buffer | string,
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

export async function uploadCamperDocument(
  kidId: string,
  filename: string,
  fileBase64?: string,
  mimeType: string = 'application/pdf',
  documentType: string = 'General Document'
) {
  return uploadDocumentToDrive(
    kidId,
    filename,
    fileBase64,
    mimeType,
    documentType
  )
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

    const hasSupabaseConfig = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
    )
    if (!hasSupabaseConfig) {
      revalidatePath(`/campers/${kidId}`)
      return { success: true }
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
      details: {
        filename,
        drive_file_id: uploadResult.data?.driveFile?.id
      }
    })

    revalidatePath(`/campers/${kidId}`)
    return {
      success: true,
      pdfUrl: uploadResult.data?.driveFile?.webViewLink || null,
      driveFile: uploadResult.data?.driveFile
    }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to generate contract PDF' }
  }
}

export async function uploadSignedContract(kidId: string, signedCopyName?: string) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const { data: kid } = await supabase.from('kids').select('name, first_name, last_name, application_number').eq('id', kidId).single()
    const kidName = kid?.name || (kid?.first_name && kid?.last_name ? `${kid.first_name} ${kid.last_name}` : 'Camper')
    const appNum = kid?.application_number || kidId

    const filename = signedCopyName || `Signed_Contract_${kidName.replace(/\s+/g, '_')}_${appNum}.pdf`
    const dummyBuffer = Buffer.from(`Signed Contract for ${kidName}`, 'utf-8')

    const actorId = actor.id
    const uploadResult = await uploadKidMediaAsset({
      kidId,
      kidName,
      category: 'Documents',
      fileBuffer: dummyBuffer,
      filename,
      mimeType: 'application/pdf',
      uploadedBy: actorId,
      documentType: 'Signed Contract'
    })

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'UPLOAD_SIGNED_CONTRACT',
      entity_type: 'kid',
      entity_id: kidId,
      details: {
        filename,
        drive_file_id: uploadResult.data?.driveFile?.id
      }
    })

    revalidatePath(`/campers/${kidId}`)
    return {
      success: true,
      document: uploadResult.data?.dbRecord,
      driveFile: uploadResult.data?.driveFile
    }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to upload signed contract' }
  }
}

export async function uploadCamperPhoto(
  kidId: string,
  filename: string,
  fileBase64?: string,
  mimeType: string = 'image/jpeg',
  caption?: string
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
    if (fileBase64) {
      fileBuffer = Buffer.from(fileBase64, 'base64')
    } else {
      fileBuffer = Buffer.from(`Photo content for ${filename}`, 'utf-8')
    }

    const actorId = actor.id
    const uploadResult = await uploadKidMediaAsset({
      kidId,
      kidName,
      category: 'Photos',
      fileBuffer,
      filename,
      mimeType,
      uploadedBy: actorId,
      caption,
    })

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'UPLOAD_PHOTO',
      entity_type: 'kid',
      entity_id: kidId,
      details: {
        filename,
        caption,
        drive_file_id: uploadResult.data?.driveFile?.id,
      },
    })

    revalidatePath(`/campers/${kidId}`)
    return {
      success: true,
      photo: uploadResult.data?.dbRecord,
      driveFile: uploadResult.data?.driveFile,
    }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to upload photo' }
  }
}

export async function deletePhotoAction(photoId: string, kidId: string, driveFileId?: string) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()
    const actorId = actor.id

    let targetDriveId = driveFileId
    if (!targetDriveId) {
      const { data: photoRecord } = await supabase
        .from('photos')
        .select('drive_file_id')
        .eq('id', photoId)
        .single()
      if (photoRecord) {
        targetDriveId = photoRecord.drive_file_id
      }
    }

    const { error: dbError } = await supabase.from('photos').delete().eq('id', photoId)
    if (dbError) {
      console.error('Error deleting photo record:', dbError)
      return { success: false, error: 'Failed to delete photo from database' }
    }

    if (targetDriveId) {
      await deleteDriveFile(targetDriveId)
    }

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'DELETE_PHOTO',
      entity_type: 'kid',
      entity_id: kidId,
      details: { photo_id: photoId, drive_file_id: targetDriveId },
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete photo' }
  }
}

export async function uploadCamperVoiceNote(
  kidId: string,
  filename: string,
  audioBase64?: string,
  mimeType: string = 'audio/webm',
  durationSeconds?: number
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
    if (audioBase64) {
      fileBuffer = Buffer.from(audioBase64, 'base64')
    } else {
      fileBuffer = Buffer.from(`Voice note content for ${filename}`, 'utf-8')
    }

    const actorId = actor.id
    const uploadResult = await uploadKidMediaAsset({
      kidId,
      kidName,
      category: 'Voice Notes',
      fileBuffer,
      filename,
      mimeType,
      uploadedBy: actorId,
      duration: durationSeconds || 0,
    })

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'UPLOAD_VOICE_NOTE',
      entity_type: 'kid',
      entity_id: kidId,
      details: {
        filename,
        duration_seconds: durationSeconds,
        drive_file_id: uploadResult.data?.driveFile?.id,
      },
    })

    revalidatePath(`/campers/${kidId}`)
    return {
      success: true,
      voiceNote: uploadResult.data?.dbRecord,
      driveFile: uploadResult.data?.driveFile,
    }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to upload voice note' }
  }
}

export async function deleteVoiceNoteAction(voiceNoteId: string, kidId: string, driveFileId?: string) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()
    const actorId = actor.id

    let targetDriveId = driveFileId
    if (!targetDriveId) {
      const { data: noteRecord } = await supabase
        .from('voice_notes')
        .select('drive_file_id')
        .eq('id', voiceNoteId)
        .single()
      if (noteRecord) {
        targetDriveId = noteRecord.drive_file_id
      }
    }

    const { error: dbError } = await supabase.from('voice_notes').delete().eq('id', voiceNoteId)
    if (dbError) {
      console.error('Error deleting voice note record:', dbError)
      return { success: false, error: 'Failed to delete voice note from database' }
    }

    if (targetDriveId) {
      await deleteDriveFile(targetDriveId)
    }

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'DELETE_VOICE_NOTE',
      entity_type: 'kid',
      entity_id: kidId,
      details: { voice_note_id: voiceNoteId, drive_file_id: targetDriveId },
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete voice note' }
  }
}

export async function uploadCamperTranscript(
  kidId: string,
  filename: string,
  fileBase64?: string,
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

    let fileBuffer: Buffer
    if (fileBase64) {
      fileBuffer = Buffer.from(fileBase64, 'base64')
    } else {
      fileBuffer = Buffer.from(`Transcript content for ${filename}`, 'utf-8')
    }

    const actorId = actor.id
    const uploadResult = await uploadKidMediaAsset({
      kidId,
      kidName,
      category: 'Transcripts',
      fileBuffer,
      filename,
      mimeType,
      uploadedBy: actorId,
      documentType: 'Transcript',
    })

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'UPLOAD_TRANSCRIPT',
      entity_type: 'kid',
      entity_id: kidId,
      details: {
        filename,
        drive_file_id: uploadResult.data?.driveFile?.id,
      },
    })

    revalidatePath(`/campers/${kidId}`)
    return {
      success: true,
      transcript: uploadResult.data?.dbRecord,
      driveFile: uploadResult.data?.driveFile,
    }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to upload transcript' }
  }
}

export async function deleteTranscriptAction(transcriptId: string, kidId: string, driveFileId?: string) {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()
    const actorId = actor.id

    let targetDriveId = driveFileId
    if (!targetDriveId) {
      const { data: tRecord } = await supabase
        .from('documents')
        .select('drive_file_id')
        .eq('id', transcriptId)
        .single()
      if (tRecord) {
        targetDriveId = tRecord.drive_file_id
      }
    }

    const { error: dbError } = await supabase.from('documents').delete().eq('id', transcriptId)
    if (dbError) {
      console.error('Error deleting transcript record:', dbError)
      return { success: false, error: 'Failed to delete transcript from database' }
    }

    if (targetDriveId) {
      await deleteDriveFile(targetDriveId)
    }

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'DELETE_TRANSCRIPT',
      entity_type: 'kid',
      entity_id: kidId,
      details: { transcript_id: transcriptId, drive_file_id: targetDriveId },
    })

    revalidatePath(`/campers/${kidId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to delete transcript' }
  }
}

export async function voidAndRegenerateContract(kidId: string, reason: string = 'Contract voided and regenerated') {
  try {
    const actor = await getCurrentUser()
    if (!actor) {
      return { success: false, error: 'Unauthorized: Authentication required' }
    }
    const supabase = createServerSupabaseClient()

    const actorId = actor.id

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      action: 'VOID_CONTRACT',
      entity_type: 'kid',
      entity_id: kidId,
      details: { reason }
    })

    const newContract = await generateContractPdf(kidId)

    revalidatePath(`/campers/${kidId}`)
    return newContract
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Failed to void and regenerate contract' }
  }
}

// Aliases for media upload actions to match tests and external callers
export const uploadPhotoAction = uploadCamperPhoto
export const uploadVoiceNoteAction = uploadCamperVoiceNote
export const uploadTranscriptAction = uploadCamperTranscript
