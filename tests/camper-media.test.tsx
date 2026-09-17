import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
    if (typeof window !== 'undefined' && !window.ResizeObserver) {
      window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
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
})
