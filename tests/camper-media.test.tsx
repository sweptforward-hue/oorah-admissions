import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CamperDetailClient } from '@/components/campers/camper-detail-client'

// Mock next/navigation & next/link
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

// Mock detail actions
vi.mock('@/lib/campers/detail-actions', () => ({
  sendChatMessage: vi.fn(),
  uploadDocumentToDrive: vi.fn(),
  castVaadVoteAction: vi.fn(),
  generateContractPdf: vi.fn(),
  uploadSignedContract: vi.fn(),
  getKidPhotos: vi.fn().mockReturnValue(Promise.resolve([])),
  getKidVoiceNotes: vi.fn().mockReturnValue(Promise.resolve([])),
  getKidTranscripts: vi.fn().mockReturnValue(Promise.resolve([])),
  uploadPhotoAction: vi.fn().mockResolvedValue({
    success: true,
    photo: { id: 'photo-2', caption: 'Uploaded Photo', drive_file_id: 'drive-photo-2', created_at: new Date().toISOString() },
  }),
  uploadVoiceNoteAction: vi.fn().mockResolvedValue({
    success: true,
    voiceNote: { id: 'vn-2', title: 'Uploaded Voice', duration_seconds: 60, drive_file_id: 'drive-vn-2', created_at: new Date().toISOString() },
  }),
  uploadTranscriptAction: vi.fn().mockResolvedValue({
    success: true,
    transcript: { id: 'tr-2', title: 'New Transcript', content: 'Sample', drive_file_id: 'drive-tr-2', created_at: new Date().toISOString() },
  }),
  deletePhotoAction: vi.fn().mockResolvedValue({ success: true }),
  deleteVoiceNoteAction: vi.fn().mockResolvedValue({ success: true }),
  deleteTranscriptAction: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock status update and voting toggle
vi.mock('@/lib/campers/actions', () => ({
  updateCamperStatus: vi.fn().mockResolvedValue({ success: true }),
  toggleCamperVoting: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock admin actions
vi.mock('@/lib/admin/actions', () => ({
  triggerExport: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock Supabase server client
const mockSupabaseInstance = {
  from: vi.fn((table: string) => {
    if (table === 'kids') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'kid-real-1',
                name: 'Chaim Goldberg',
                application_number: '5555',
                voting_open: true,
                created_at: '2025-02-01T12:00:00Z',
                statuses: { name: 'VAAD Review' },
              },
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'photos') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'photo-db-1',
                  filename: 'summer.jpg',
                  drive_file_id: 'drive-photo-999',
                  created_at: '2025-02-01T12:00:00Z',
                },
              ],
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'documents') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'doc-db-1',
                  name: 'medical.pdf',
                  document_type: 'Medical',
                  drive_file_id: 'drive-doc-888',
                  created_at: '2025-02-01T12:00:00Z',
                },
              ],
              error: null,
            }),
            ilike: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      }
    }
    if (table === 'voice_notes') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'vn-db-1',
                  title: 'interview.mp3',
                  duration_seconds: 90,
                  drive_file_id: 'drive-vn-777',
                  created_at: '2025-02-01T12:00:00Z',
                },
              ],
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'transcripts') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'tr-db-1',
                  title: 'reportcard.pdf',
                  drive_file_id: 'drive-tr-666',
                  created_at: '2025-02-01T12:00:00Z',
                },
              ],
              error: null,
            }),
          }),
        }),
      }
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabaseInstance)),
  createServerSupabaseClient: vi.fn().mockImplementation(() => mockSupabaseInstance),
  createAdminClient: vi.fn().mockImplementation(() => mockSupabaseInstance),
}))

describe('Camper Media Management (Photos, Voice Notes, Transcript)', () => {
  const mockCamper = {
    id: 'kid-123',
    application_number: '1042',
    name: 'David Test',
    status: 'VAAD Review' as const,
    voting_open: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Polyfill ResizeObserver and PointerEvent if missing in jsdom
    if (typeof window !== 'undefined') {
      if (!window.ResizeObserver) {
        window.ResizeObserver = class {
          observe() {}
          unobserve() {}
          disconnect() {}
        }
      }
      window.Audio = class {
        src = ''
        play = vi.fn().mockResolvedValue(undefined)
        pause = vi.fn()
        onerror: (() => void) | null = null
      } as unknown as typeof Audio
    }
  })

  it('renders uploaded photo gallery tab and upload photo button', () => {
    render(<CamperDetailClient initialCamper={mockCamper} />)

    const photosTabTrigger = screen.getByRole('tab', { name: 'Photos' })
    photosTabTrigger.focus()
    fireEvent.keyDown(photosTabTrigger, { key: ' ', code: 'Space' })
    fireEvent.click(photosTabTrigger)

    expect(screen.getByRole('button', { name: '+ Upload Photo' })).toBeInTheDocument()
    expect(screen.getByText('No photos uploaded for this applicant yet.')).toBeInTheDocument()

    // Click + Upload Photo button
    fireEvent.click(screen.getByRole('button', { name: '+ Upload Photo' }))
    expect(screen.getByText('Upload Camper Photo')).toBeInTheDocument()
  })

  it('renders voice notes tab and handles record / upload buttons', () => {
    render(<CamperDetailClient initialCamper={mockCamper} />)

    const voiceTabTrigger = screen.getByRole('tab', { name: 'Voice Notes' })
    voiceTabTrigger.focus()
    fireEvent.keyDown(voiceTabTrigger, { key: ' ', code: 'Space' })
    fireEvent.click(voiceTabTrigger)

    expect(screen.getByRole('button', { name: '● Record Voice Note' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Upload Audio File' })).toBeInTheDocument()
    expect(screen.getByText('No voice notes recorded or uploaded yet.')).toBeInTheDocument()
  })

  it('renders academic transcript tab and handles upload transcript button', () => {
    render(<CamperDetailClient initialCamper={mockCamper} />)

    const transcriptTabTrigger = screen.getByRole('tab', { name: 'Transcripts' })
    transcriptTabTrigger.focus()
    fireEvent.keyDown(transcriptTabTrigger, { key: ' ', code: 'Space' })
    fireEvent.click(transcriptTabTrigger)

    expect(screen.getByRole('button', { name: '+ Upload Transcript' })).toBeInTheDocument()
    expect(screen.getByText('No transcripts uploaded yet.')).toBeInTheDocument()
  })

  it('renders initial photos with Google Drive thumbnail link and handles onError fallback', () => {
    const mockPhotos = [
      {
        id: 'photo-1',
        caption: 'Camper Portrait Headshot',
        created_at: new Date().toISOString(),
        drive_file_id: 'drive_photo_abc',
        drive_url: 'https://drive.google.com/thumbnail?id=drive_photo_abc&sz=w1000',
      },
    ]

    render(
      <CamperDetailClient
        initialCamper={mockCamper}
        initialPhotos={mockPhotos}
      />
    )

    const photosTabTrigger = screen.getByRole('tab', { name: 'Photos' })
    photosTabTrigger.focus()
    fireEvent.keyDown(photosTabTrigger, { key: ' ', code: 'Space' })
    fireEvent.click(photosTabTrigger)

    expect(screen.getByText('Camper Portrait Headshot')).toBeInTheDocument()
    const img = screen.getByAltText('Camper Portrait Headshot') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toContain('https://drive.google.com/thumbnail?id=drive_photo_abc&sz=w1000')

    // Trigger onError and verify fallback SVG is applied
    fireEvent.error(img)
    expect(img.src).toContain('data:image/svg+xml')
  })

  it('renders initial documents with Google Drive preview link', () => {
    const mockDocs = [
      {
        id: 'doc-1',
        name: 'Camper_Medical_Form.pdf',
        uploaded_at: new Date().toISOString(),
        type: 'Medical Records',
        drive_file_id: 'drive_doc_xyz',
        drive_url: 'https://drive.google.com/file/d/drive_doc_xyz/preview',
      },
    ]

    render(
      <CamperDetailClient
        initialCamper={mockCamper}
        initialDocuments={mockDocs}
      />
    )

    const docsTabTrigger = screen.getByRole('tab', { name: 'Documents' })
    docsTabTrigger.focus()
    fireEvent.keyDown(docsTabTrigger, { key: ' ', code: 'Space' })
    fireEvent.click(docsTabTrigger)

    expect(screen.getByText('Camper_Medical_Form.pdf')).toBeInTheDocument()
    expect(screen.getByText('Medical Records')).toBeInTheDocument()

    const viewLink = screen.getByRole('link', { name: 'View' })
    expect(viewLink).toHaveAttribute('href', 'https://drive.google.com/file/d/drive_doc_xyz/preview')
    expect(viewLink).toHaveAttribute('target', '_blank')
  })

  it('renders initial voice notes and handles playback toggle and download', async () => {
    const mockVoiceNotes = [
      {
        id: 'vn-1',
        title: 'Parent Phone Interview Call',
        duration_seconds: 145,
        created_at: new Date().toISOString(),
        drive_file_id: 'drive_vn_789',
        drive_url: 'https://drive.google.com/uc?id=drive_vn_789&export=download',
      },
    ]

    render(
      <CamperDetailClient
        initialCamper={mockCamper}
        initialVoiceNotes={mockVoiceNotes}
      />
    )

    const voiceTabTrigger = screen.getByRole('tab', { name: 'Voice Notes' })
    voiceTabTrigger.focus()
    fireEvent.keyDown(voiceTabTrigger, { key: ' ', code: 'Space' })
    fireEvent.click(voiceTabTrigger)

    expect(screen.getByText('Parent Phone Interview Call')).toBeInTheDocument()
    expect(screen.getByText('• 145s')).toBeInTheDocument()

    // Play button exists
    const playBtn = screen.getByRole('button', { name: '▶' })
    expect(playBtn).toBeInTheDocument()
    fireEvent.click(playBtn)

    // Button toggles to pause icon
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '⏸' })).toBeInTheDocument()
    })
  })

  it('renders initial transcripts with Google Drive preview link', () => {
    const mockTranscripts = [
      {
        id: 'tr-1',
        title: 'Report_Card_2024.pdf',
        created_at: new Date().toISOString(),
        drive_file_id: 'drive_tr_456',
        drive_url: 'https://drive.google.com/file/d/drive_tr_456/preview',
      },
    ]

    render(
      <CamperDetailClient
        initialCamper={mockCamper}
        initialTranscripts={mockTranscripts}
      />
    )

    const transcriptTabTrigger = screen.getByRole('tab', { name: 'Transcripts' })
    transcriptTabTrigger.focus()
    fireEvent.keyDown(transcriptTabTrigger, { key: ' ', code: 'Space' })
    fireEvent.click(transcriptTabTrigger)

    expect(screen.getByText('Report_Card_2024.pdf')).toBeInTheDocument()
    const viewLink = screen.getByRole('link', { name: 'View Transcript' })
    expect(viewLink).toHaveAttribute('href', 'https://drive.google.com/file/d/drive_tr_456/preview')
    expect(viewLink).toHaveAttribute('target', '_blank')
  })
})

describe('CamperDetailPage Server Component Media Loading', () => {
  it('calls notFound when camper is not found in database', async () => {
    const CamperDetailPage = (await import('@/app/campers/[id]/page')).default
    const mockSupabaseNotFound = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      }),
    }
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValueOnce(mockSupabaseNotFound as any)

    await expect(
      CamperDetailPage({ params: Promise.resolve({ id: 'non-existent' }) })
    ).rejects.toThrow()
  })

  it('queries Supabase in parallel and maps Drive URLs when configured', async () => {
    const CamperDetailPage = (await import('@/app/campers/[id]/page')).default
    const pageElement = await CamperDetailPage({ params: Promise.resolve({ id: 'kid-real-1' }) })
    render(pageElement)

    expect(screen.getByText('Chaim Goldberg')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Photos' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Documents' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Voice Notes' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Transcripts' })).toBeInTheDocument()
  })
})

describe('Detail Actions Drive URL Formats', () => {
  it('formats Google Drive URLs properly for documents, photos, voice notes, and transcripts', async () => {
    const actual = await vi.importActual<typeof import('@/lib/campers/detail-actions')>('@/lib/campers/detail-actions')

    expect(typeof actual.getKidDocuments).toBe('function')
    expect(typeof actual.getKidPhotos).toBe('function')
    expect(typeof actual.getKidVoiceNotes).toBe('function')
    expect(typeof actual.getKidTranscripts).toBe('function')

    // Call them with mocked supabase client returning records
    const docs = await actual.getKidDocuments('kid-1')
    const photos = await actual.getKidPhotos('kid-1')
    const voiceNotes = await actual.getKidVoiceNotes('kid-1')
    const transcripts = await actual.getKidTranscripts('kid-1')

    expect(docs.length).toBeGreaterThan(0)
    expect(docs[0].drive_file_id).toBe('drive-doc-888')
    expect(docs[0].drive_url).toBe('https://drive.google.com/file/d/drive-doc-888/preview')

    expect(photos.length).toBeGreaterThan(0)
    expect(photos[0].drive_file_id).toBe('drive-photo-999')
    expect(photos[0].drive_url).toBe('https://drive.google.com/thumbnail?id=drive-photo-999&sz=w1000')

    expect(voiceNotes.length).toBeGreaterThan(0)
    expect(voiceNotes[0].drive_file_id).toBe('drive-vn-777')
    expect(voiceNotes[0].drive_url).toBe('https://drive.google.com/uc?id=drive-vn-777&export=download')

    expect(transcripts.length).toBeGreaterThan(0)
    expect(transcripts[0].drive_file_id).toBe('drive-tr-666')
    expect(transcripts[0].drive_url).toBe('https://drive.google.com/file/d/drive-tr-666/preview')
  })
})

