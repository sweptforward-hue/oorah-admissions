import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { CamperDetailClient, CamperDocument } from '@/components/campers/camper-detail-client'
import { Kid } from '@/types'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

// Mock server actions
vi.mock('@/lib/campers/actions', () => ({
  updateCamperStatus: vi.fn().mockResolvedValue({ success: true }),
  toggleCamperVoting: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/campers/detail-actions', () => ({
  sendChatMessage: vi.fn().mockResolvedValue({ success: true }),
  uploadDocumentToDrive: vi.fn().mockResolvedValue({
    success: true,
    document: {
      id: 'doc-new',
      kid_id: '1',
      name: 'Uploaded_Medical_Release.pdf',
      file_type: 'application/pdf',
      file_size: 2048,
      drive_file_id: 'drive_medical_123',
      document_type: 'Medical Forms',
      created_at: new Date().toISOString(),
    },
  }),
  deleteDocumentAction: vi.fn().mockResolvedValue({ success: true }),
  castVaadVoteAction: vi.fn().mockResolvedValue({ success: true }),
  generateContractPdf: vi.fn().mockResolvedValue({ success: true, pdfUrl: '/api/media/proxy/drive_123' }),
  uploadSignedContract: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/admin/actions', () => ({
  triggerExport: vi.fn().mockResolvedValue({ success: true }),
}))

const mockCamper: Kid = {
  id: '1',
  application_number: '1042',
  name: 'John Smith',
  status: 'VAAD Review',
  voting_open: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const mockDocuments: CamperDocument[] = [
  {
    id: 'doc-1',
    kid_id: '1',
    name: 'Application_Form.pdf',
    file_type: 'application/pdf',
    file_size: 1024,
    drive_file_id: 'drive_app_1',
    document_type: 'Application Forms',
    created_at: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'doc-2',
    kid_id: '1',
    name: 'Parent_Survey.pdf',
    file_type: 'application/pdf',
    file_size: 2048,
    drive_file_id: 'drive_parent_2',
    document_type: 'Parent Questionnaire',
    created_at: '2025-01-02T00:00:00.000Z',
  },
]

function selectDocumentsTab() {
  const documentsTabTrigger = screen.getByRole('tab', { name: /Documents/i })
  act(() => {
    fireEvent.focus(documentsTabTrigger)
    fireEvent.keyDown(documentsTabTrigger, { key: 'Enter', code: 'Enter' })
    fireEvent.click(documentsTabTrigger)
  })
}

describe('Camper Documents Tab', () => {
  it('renders category filter pills and documents list', () => {
    render(<CamperDetailClient initialCamper={mockCamper} initialDocuments={mockDocuments} />)

    selectDocumentsTab()

    // Check category filter pills exist
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Application Forms' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Parent Questionnaire' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Medical Forms' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Transcripts' })).toBeInTheDocument()

    // Both documents rendered under All
    expect(screen.getByText('Application_Form.pdf')).toBeInTheDocument()
    expect(screen.getByText('Parent_Survey.pdf')).toBeInTheDocument()
  })

  it('filters documents when category filter button is clicked', () => {
    render(<CamperDetailClient initialCamper={mockCamper} initialDocuments={mockDocuments} />)

    selectDocumentsTab()

    // Click Application Forms filter
    const appFilter = screen.getByRole('button', { name: 'Application Forms' })
    fireEvent.click(appFilter)

    expect(screen.getByText('Application_Form.pdf')).toBeInTheDocument()
    expect(screen.queryByText('Parent_Survey.pdf')).not.toBeInTheDocument()

    // Click Medical Forms filter (empty)
    const medFilter = screen.getByRole('button', { name: 'Medical Forms' })
    fireEvent.click(medFilter)

    expect(screen.queryByText('Application_Form.pdf')).not.toBeInTheDocument()
    expect(screen.getByText(/No documents found for category "Medical Forms"/i)).toBeInTheDocument()
  })

  it('provides View and Download links for each document', () => {
    render(<CamperDetailClient initialCamper={mockCamper} initialDocuments={mockDocuments} />)

    selectDocumentsTab()

    const viewLinks = screen.getAllByRole('link', { name: /View \/ Open/i })
    expect(viewLinks[0]).toHaveAttribute('href', '/api/media/proxy/drive_app_1')
    expect(viewLinks[0]).toHaveAttribute('target', '_blank')

    const downloadLinks = screen.getAllByRole('link', { name: /Download/i })
    expect(downloadLinks[0]).toHaveAttribute('href', '/api/media/proxy/drive_app_1?download=true')
    expect(downloadLinks[0]).toHaveAttribute('download', 'Application_Form.pdf')
  })

  it('opens confirmation modal and deletes document on confirm', async () => {
    const { deleteDocumentAction } = await import('@/lib/campers/detail-actions')

    render(<CamperDetailClient initialCamper={mockCamper} initialDocuments={mockDocuments} />)

    selectDocumentsTab()

    // Click Delete on first document
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    fireEvent.click(deleteButtons[0])

    // Confirm dialog should be open
    expect(screen.getByText(/Are you sure you want to delete "Application_Form.pdf"/i)).toBeInTheDocument()

    // Click Confirm Delete inside Modal
    const confirmButton = screen.getByRole('button', { name: 'Delete Document' })
    fireEvent.click(confirmButton)

    expect(deleteDocumentAction).toHaveBeenCalledWith('doc-1', '1', 'drive_app_1')
  })
})
