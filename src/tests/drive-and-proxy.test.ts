import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAccessToken,
  ensureKidFolderHierarchy,
  uploadKidMediaAsset,
} from '@/lib/google/drive'
import { GET } from '@/app/api/media/proxy/[fileId]/route'
import { NextRequest } from 'next/server'

// Mocks
vi.mock('@/lib/supabase/server', () => {
  const mockInsert = vi.fn().mockReturnThis()
  const mockSelect = vi.fn().mockReturnThis()
  const mockSingle = vi.fn().mockResolvedValue({
    data: { id: 'mock-db-id-123' },
    error: null,
  })

  const mockFrom = vi.fn().mockReturnValue({
    insert: mockInsert,
    select: mockSelect,
    single: mockSingle,
  })

  return {
    createClient: vi.fn().mockResolvedValue({
      from: mockFrom,
      auth: {
        getUser: vi.fn().mockImplementation((token?: string) => {
          if (token === 'invalid-token') {
            return Promise.resolve({ data: { user: null }, error: new Error('Invalid token') })
          }
          return Promise.resolve({
            data: { user: { id: 'user-123', email: 'test@oorah.org' } },
            error: null,
          })
        }),
      },
    }),
  }
})

describe('Google Drive API & Media Proxy Integration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('Google Auth & Access Token', () => {
    it('returns a mock token when no credentials are configured', async () => {
      delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      delete process.env.GOOGLE_PRIVATE_KEY
      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_SECRET

      const token = await getAccessToken()
      expect(token).toBe('mock-access-token')
    })

    it('exchanges OAuth refresh token for access token when refresh token is configured', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id'
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
      process.env.GOOGLE_REFRESH_TOKEN = 'test-refresh-token'
      delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      delete process.env.GOOGLE_PRIVATE_KEY

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'oauth-access-token-123',
          expires_in: 3600,
        }),
      } as Response)

      const token = await getAccessToken()
      expect(token).toBe('oauth-access-token-123')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  describe('Folder Hierarchy Management', () => {
    it('ensures automatic folder hierarchy structure for a kid', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (typeof url === 'string' && url.includes('/drive/v3/files?q=')) {
          // Folder search -> return no files found to trigger creation
          return {
            ok: true,
            json: async () => ({ files: [] }),
          } as Response
        }

        if (typeof url === 'string' && url.includes('/drive/v3/files?fields=id')) {
          // Folder creation
          const body = JSON.parse((init?.body as string) || '{}')
          return {
            ok: true,
            json: async () => ({ id: `folder-id-${body.name.replace(/\s+/g, '-').toLowerCase()}` }),
          } as Response
        }

        return { ok: true, json: async () => ({}) } as Response
      })

      const hierarchy = await ensureKidFolderHierarchy('1042', 'John Smith')

      expect(hierarchy.rootFolderId).toBeDefined()
      expect(hierarchy.kidFolderId).toBeDefined()
      expect(hierarchy.subfolders.Photos).toBeDefined()
      expect(hierarchy.subfolders['Voice Notes']).toBeDefined()
      expect(hierarchy.subfolders.Documents).toBeDefined()
      expect(hierarchy.subfolders.Transcripts).toBeDefined()
      expect(hierarchy.subfolders['Chat Exports']).toBeDefined()
    })
  })

  describe('File Upload and Metadata Persistence', () => {
    it('uploads a file to Drive and persists metadata in PostgreSQL', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (typeof url === 'string' && url.includes('/drive/v3/files?q=')) {
          return {
            ok: true,
            json: async () => ({ files: [{ id: 'existing-folder-id' }] }),
          } as Response
        }

        if (typeof url === 'string' && url.includes('/upload/drive/v3/files')) {
          return {
            ok: true,
            json: async () => ({
              id: 'drive-file-abc-123',
              name: 'audio.mp3',
              mimeType: 'audio/mpeg',
              size: '10240',
            }),
          } as Response
        }

        return { ok: true, json: async () => ({}) } as Response
      })

      const result = await uploadKidMediaAsset({
        kidId: '1042',
        kidName: 'John Smith',
        category: 'Voice Notes',
        fileBuffer: Buffer.from('test audio content'),
        filename: 'interview-note.mp3',
        mimeType: 'audio/mpeg',
        uploadedBy: 'user-123',
        caption: 'Parent conversation',
        duration: 120,
      })

      expect(result.success).toBe(true)
      expect(result.data?.driveFile.id).toBe('drive-file-abc-123')
      expect(result.data?.dbRecord.id).toBe('mock-db-id-123')
    })

    it('handles errors during file upload gracefully', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (typeof url === 'string' && url.includes('/upload/drive/v3/files')) {
          return {
            ok: false,
            status: 500,
            text: async () => 'Internal Drive Error',
          } as Response
        }
        return { ok: true, json: async () => ({ files: [{ id: 'folder-123' }] }) } as Response
      })

      const result = await uploadKidMediaAsset({
        kidId: '1042',
        kidName: 'John Smith',
        category: 'Photos',
        fileBuffer: Buffer.from('photo data'),
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Google Drive upload failed')
    })
  })

  describe('Streaming Proxy Route Handler (/api/media/proxy/[fileId])', () => {
    it('returns 401 Unauthorized when user is not authenticated', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValueOnce({
        from: vi.fn(),
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Not logged in') }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>)

      const req = new NextRequest('http://localhost:3000/api/media/proxy/file-123')
      const res = await GET(req, { params: Promise.resolve({ fileId: 'file-123' }) })

      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 Unauthorized when Authorization header is invalid', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      vi.mocked(createClient).mockResolvedValueOnce({
        from: vi.fn(),
        auth: {
          getUser: vi.fn().mockImplementation((token?: string) => {
            if (token === 'invalid-token') {
              return Promise.resolve({ data: { user: null }, error: new Error('Invalid token') })
            }
            return Promise.resolve({ data: { user: null }, error: new Error('Not logged in') })
          }),
        },
      } as unknown as Awaited<ReturnType<typeof createClient>>)

      const req = new NextRequest('http://localhost:3000/api/media/proxy/file-123', {
        headers: { Authorization: 'Bearer invalid-token' },
      })
      const res = await GET(req, { params: Promise.resolve({ fileId: 'file-123' }) })

      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('streams full content with 200 OK when Range header is not present', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (typeof url === 'string' && url.includes('/drive/v3/files/file-123?fields=')) {
          return {
            ok: true,
            json: async () => ({
              id: 'file-123',
              name: 'sample.mp4',
              mimeType: 'video/mp4',
              size: '1000000',
            }),
          } as Response
        }

        if (typeof url === 'string' && url.includes('/drive/v3/files/file-123?alt=media')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({
              'content-type': 'video/mp4',
              'content-length': '1000000',
            }),
            body: new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode('video stream content'))
                controller.close()
              },
            }),
          } as Response
        }

        return { ok: true, json: async () => ({}) } as Response
      })

      const req = new NextRequest('http://localhost:3000/api/media/proxy/file-123')
      const res = await GET(req, { params: Promise.resolve({ fileId: 'file-123' }) })

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('video/mp4')
      expect(res.headers.get('Accept-Ranges')).toBe('bytes')
    })

    it('streams partial content with HTTP 206 Partial Content when Range header is sent', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        if (typeof url === 'string' && url.includes('/drive/v3/files/file-123?fields=')) {
          return {
            ok: true,
            json: async () => ({
              id: 'file-123',
              name: 'sample.mp3',
              mimeType: 'audio/mpeg',
              size: '50000',
            }),
          } as Response
        }

        if (typeof url === 'string' && url.includes('/drive/v3/files/file-123?alt=media')) {
          const headersObj = init?.headers as Record<string, string> | undefined
          const range = headersObj?.Range
          expect(range).toBe('bytes=0-1024')

          return {
            ok: true,
            status: 206,
            headers: new Headers({
              'content-type': 'audio/mpeg',
              'content-length': '1025',
              'content-range': 'bytes 0-1024/50000',
            }),
            body: new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode('partial audio bytes'))
                controller.close()
              },
            }),
          } as Response
        }

        return { ok: true, json: async () => ({}) } as Response
      })

      const req = new NextRequest('http://localhost:3000/api/media/proxy/file-123', {
        headers: { Range: 'bytes=0-1024' },
      })
      const res = await GET(req, { params: Promise.resolve({ fileId: 'file-123' }) })

      expect(res.status).toBe(206)
      expect(res.headers.get('Content-Range')).toBe('bytes 0-1024/50000')
      expect(res.headers.get('Accept-Ranges')).toBe('bytes')
    })
  })
})
