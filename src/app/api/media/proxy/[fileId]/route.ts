import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getFileMetadata, fetchDriveFileStream } from '@/lib/google/drive'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await props.params

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId parameter' }, { status: 400 })
    }

    // 1. Authenticate request using Supabase auth
    const supabase = await createClient()
    let { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // If session cookie authentication fails, check and validate Authorization header token
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        const token = authHeader.substring(7).trim()
        if (token) {
          const { data: headerAuthData, error: headerAuthError } = await supabase.auth.getUser(token)
          if (!headerAuthError && headerAuthData.user) {
            user = headerAuthData.user
            authError = null
          }
        }
      }
    }

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Retrieve file metadata
    let metadata
    try {
      metadata = await getFileMetadata(fileId)
    } catch (err: unknown) {
      console.error(`Error fetching metadata for file ${fileId}:`, err)
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    // 3. Extract Range header from incoming request
    const rangeHeader = request.headers.get('range')

    // 4. Fetch media stream from Google Drive API
    const driveRes = await fetchDriveFileStream(fileId, rangeHeader || undefined)

    if (!driveRes.ok && driveRes.status !== 206) {
      console.error(`Google Drive stream error for file ${fileId}: ${driveRes.status}`)
      return NextResponse.json(
        { error: 'Failed to stream media from external storage' },
        { status: driveRes.status === 404 ? 404 : 500 }
      )
    }

    // 5. Construct response headers
    const responseHeaders = new Headers()

    const contentType = driveRes.headers.get('content-type') || metadata.mimeType || 'application/octet-stream'
    responseHeaders.set('Content-Type', contentType)

    const contentLength = driveRes.headers.get('content-length') || (metadata.size ? String(metadata.size) : null)
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength)
    }

    const contentRange = driveRes.headers.get('content-range')
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange)
    }

    responseHeaders.set('Accept-Ranges', 'bytes')
    responseHeaders.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    responseHeaders.set('Content-Disposition', `inline; filename="${encodeURIComponent(metadata.name)}"`)

    const responseStatus = driveRes.status === 206 || (rangeHeader && contentRange) ? 206 : 200

    // Return streamed response body
    return new Response(driveRes.body, {
      status: responseStatus,
      headers: responseHeaders,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error in media proxy'
    console.error('Error in streaming proxy endpoint:', err)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
