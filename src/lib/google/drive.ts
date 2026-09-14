import crypto from 'crypto'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type MediaCategory = 'Photos' | 'Voice Notes' | 'Documents' | 'Transcripts' | 'Chat Exports'

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  webViewLink?: string
}

export interface FolderHierarchy {
  rootFolderId: string
  kidFolderId: string
  subfolders: {
    Photos: string
    'Voice Notes': string
    Documents: string
    Transcripts: string
    'Chat Exports': string
  }
}

export interface UploadKidMediaAssetParams {
  kidId: string
  kidName: string
  category: MediaCategory
  fileBuffer: Buffer
  filename: string
  mimeType: string
  uploadedBy?: string
  caption?: string
  duration?: number
  documentType?: string
}

export interface DbMediaRecord {
  id: string
  kid_id: string
  uploaded_by?: string | null
  filename: string
  caption?: string | null
  duration?: number | null
  document_type?: string | null
  mime_type?: string | null
  drive_file_id: string
  created_at: string
  updated_at?: string
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null

/**
 * Creates an RSA-SHA256 signed JWT for Google Service Account authentication.
 */
function createServiceAccountJwt(clientEmail: string, privateKey: string): string {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const unsignedToken = `${encodedHeader}.${encodedPayload}`

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(unsignedToken)
  signer.end()

  const signature = signer.sign(privateKey, 'base64url')
  return `${unsignedToken}.${signature}`
}

/**
 * Obtains an OAuth 2.0 access token using the service account private key.
 */
export async function getAccessToken(): Promise<string | null> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    return null
  }

  const now = Date.now()
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60000) {
    return cachedAccessToken.token
  }

  try {
    const assertion = createServiceAccountJwt(clientEmail, privateKey)
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Failed to get Google OAuth token:', errText)
      return null
    }

    const data = await res.json()
    cachedAccessToken = {
      token: data.access_token,
      expiresAt: now + (data.expires_in || 3600) * 1000,
    }
    return data.access_token
  } catch (err) {
    console.error('Error fetching Google access token:', err)
    return null
  }
}

/**
 * Verifies connectivity to Google Drive API.
 */
export async function verifyDriveConnection(): Promise<{ success: boolean; message: string }> {
  const token = await getAccessToken()
  if (!token) {
    return {
      success: true,
      message: 'Google Cloud Platform OAuth connection simulated (dev/test environment).',
    }
  }

  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, message: `Drive verification failed: ${errText}` }
    }

    return { success: true, message: 'Google Cloud Platform OAuth connection verified successfully.' }
  } catch (err: any) {
    return { success: false, message: `Drive connection error: ${err.message}` }
  }
}

/**
 * Searches for a folder by name inside a parent folder, or creates it.
 */
export async function getOrCreateFolder(
  token: string,
  folderName: string,
  parentId?: string
): Promise<string> {
  const sanitizedName = folderName.replace(/'/g, "\\'")
  let q = `name = '${sanitizedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  if (parentId) {
    q += ` and '${parentId}' in parents`
  }

  const queryUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`
  const searchRes = await fetch(queryUrl, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (searchRes.ok) {
    const data = await searchRes.json()
    if (data.files && data.files.length > 0) {
      return data.files[0].id
    }
  }

  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    }),
  })

  if (!createRes.ok) {
    throw new Error(`Failed to create Google Drive folder "${folderName}"`)
  }

  const folder = await createRes.json()
  return folder.id
}

/**
 * Ensures complete directory structure exists for a kid:
 * Oorah Admissions / Kid {ID} - {Name} / [Photos, Voice Notes, Documents, Transcripts, Chat Exports]
 */
export async function ensureKidFolderHierarchy(
  kidId: string,
  kidName: string
): Promise<FolderHierarchy> {
  const token = await getAccessToken()
  const rootConfiguredId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || 'mock_root'

  if (!token) {
    return {
      rootFolderId: rootConfiguredId,
      kidFolderId: `mock_kid_${kidId}`,
      subfolders: {
        Photos: `mock_photos_${kidId}`,
        'Voice Notes': `mock_voice_${kidId}`,
        Documents: `mock_docs_${kidId}`,
        Transcripts: `mock_transcripts_${kidId}`,
        'Chat Exports': `mock_chat_${kidId}`,
      },
    }
  }

  const rootFolderId = rootConfiguredId !== 'mock_root'
    ? rootConfiguredId
    : await getOrCreateFolder(token, 'Oorah Admissions')

  const kidFolderName = `Kid ${kidId} - ${kidName}`
  const kidFolderId = await getOrCreateFolder(token, kidFolderName, rootFolderId)

  const [photosId, voiceNotesId, docsId, transcriptsId, chatExportsId] = await Promise.all([
    getOrCreateFolder(token, 'Photos', kidFolderId),
    getOrCreateFolder(token, 'Voice Notes', kidFolderId),
    getOrCreateFolder(token, 'Documents', kidFolderId),
    getOrCreateFolder(token, 'Transcripts', kidFolderId),
    getOrCreateFolder(token, 'Chat Exports', kidFolderId),
  ])

  return {
    rootFolderId,
    kidFolderId,
    subfolders: {
      Photos: photosId,
      'Voice Notes': voiceNotesId,
      Documents: docsId,
      Transcripts: transcriptsId,
      'Chat Exports': chatExportsId,
    },
  }
}

/**
 * Uploads a file buffer directly to Google Drive via multipart upload.
 */
export async function uploadFileToDrive({
  fileBuffer,
  filename,
  mimeType,
  parentId,
}: {
  fileBuffer: Buffer
  filename: string
  mimeType: string
  parentId?: string
}): Promise<GoogleDriveFile> {
  const token = await getAccessToken()

  if (!token) {
    const fakeId = `drive_${Date.now()}_${Math.random().toString(36).substring(7)}`
    return {
      id: fakeId,
      name: filename,
      mimeType,
      size: String(fileBuffer.length),
      webViewLink: `https://drive.google.com/file/d/${fakeId}/view`,
    }
  }

  const boundary = `-------314159265358979323846`
  const delimiter = `\r\n--${boundary}\r\n`
  const closeDelimiter = `\r\n--${boundary}--`

  const metadata = {
    name: filename,
    parents: parentId ? [parentId] : undefined,
  }

  const multipartBody = Buffer.concat([
    Buffer.from(
      delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n`
    ),
    fileBuffer,
    Buffer.from(closeDelimiter),
  ])

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartBody.length),
      },
      body: multipartBody,
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Google Drive upload failed: ${errText}`)
  }

  return await res.json()
}

/**
 * Deletes or trashes a file in Google Drive.
 */
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const token = await getAccessToken()
  if (!token) return true

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch (err) {
    console.error('Error deleting Google Drive file:', err)
    return false
  }
}

/**
 * Uploads media asset with hierarchical Drive storage and Supabase metadata logging.
 */
export async function uploadKidMediaAsset(params: UploadKidMediaAssetParams) {
  const {
    kidId,
    kidName,
    category,
    fileBuffer,
    filename,
    mimeType,
    uploadedBy,
    caption,
    duration,
    documentType,
  } = params

  const hierarchy = await ensureKidFolderHierarchy(kidId, kidName)
  const targetFolderId = hierarchy.subfolders[category as keyof typeof hierarchy.subfolders] || hierarchy.kidFolderId

  const driveFile = await uploadFileToDrive({
    fileBuffer,
    filename,
    mimeType,
    parentId: targetFolderId,
  })

  const supabase = createServerSupabaseClient()
  let dbRecord: DbMediaRecord | null = null

  if (category === 'Transcripts') {
    const { data } = await supabase
      .from('documents')
      .insert({
        kid_id: kidId,
        name: filename,
        file_type: mimeType,
        file_size: fileBuffer.length,
        drive_file_id: driveFile.id,
        uploader_id: uploadedBy || null,
        document_type: 'Transcript',
      })
      .select()
      .single()
    dbRecord = data
  } else if (category === 'Documents') {
    const { data } = await supabase
      .from('documents')
      .insert({
        kid_id: kidId,
        name: filename,
        file_type: mimeType,
        file_size: fileBuffer.length,
        drive_file_id: driveFile.id,
        uploader_id: uploadedBy || null,
        document_type: documentType || 'General',
      })
      .select()
      .single()
    dbRecord = data
  } else if (category === 'Photos') {
    const { data } = await supabase
      .from('photos')
      .insert({
        kid_id: kidId,
        caption: caption || null,
        drive_file_id: driveFile.id,
        uploader_id: uploadedBy || null,
      })
      .select()
      .single()
    dbRecord = data
  } else if (category === 'Voice Notes') {
    const { data } = await supabase
      .from('voice_notes')
      .insert({
        kid_id: kidId,
        title: filename,
        duration_seconds: duration || 0,
        drive_file_id: driveFile.id,
        uploader_id: uploadedBy || null,
      })
      .select()
      .single()
    dbRecord = data
  }

  // Record audit log entry
  await supabase.from('audit_log').insert({
    actor_id: uploadedBy || null,
    action: `UPLOAD_${category.toUpperCase().replace(/\s+/g, '_')}`,
    entity_type: 'kid',
    entity_id: kidId,
    details: {
      filename,
      drive_file_id: driveFile.id,
      category,
      size_bytes: fileBuffer.length,
    },
  })

  return {
    success: true,
    data: {
      driveFile,
      dbRecord,
    },
  }
}
