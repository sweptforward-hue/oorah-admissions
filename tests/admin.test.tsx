import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AdminYearsPage from '@/app/admin/years/page'
import AdminSessionsPage from '@/app/admin/sessions/page'
import AdminCustomFieldsPage from '@/app/admin/custom-fields/page'
import AdminExportsPage from '@/app/admin/exports/page'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}))

vi.mock('@/lib/admin/actions', () => ({
  getYears: vi.fn().mockResolvedValue([
    { id: '1', year: 2025, is_active: true }
  ]),
  createYear: vi.fn(),
  updateYear: vi.fn(),
  getSessions: vi.fn().mockResolvedValue([
    { id: '1', name: 'Session A', start_date: '2025-07-01', end_date: '2025-07-28', active: true },
    { id: '2', name: 'Session B', start_date: '2025-07-30', end_date: '2025-08-26', active: true }
  ]),
  createSession: vi.fn(),
  updateSessionSchedule: vi.fn()
}))

vi.mock('@/lib/custom-fields/actions', () => ({
  getCustomFields: vi.fn().mockResolvedValue([
    { id: '1', name: 't_shirt_size', label: 'T-Shirt Size', field_type: 'dropdown', required: true, options: { entity_type: 'camper' } }
  ]),
  createCustomField: vi.fn(),
  updateCustomField: vi.fn(),
  deleteCustomField: vi.fn()
}))

describe('Admin Management Modules', () => {
  it('renders Years page with active year items', async () => {
    render(<AdminYearsPage />)
    expect(screen.getByText('Loading operational years...')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Manage Operational Years')).toBeInTheDocument()
      expect(screen.getByText('Summer 2025')).toBeInTheDocument()
    })
  })

  it('renders Sessions page with Session A and B', async () => {
    render(<AdminSessionsPage />)
    expect(screen.getByText('Loading camp sessions...')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Manage Camp Sessions')).toBeInTheDocument()
      expect(screen.getByText('Session A')).toBeInTheDocument()
      expect(screen.getByText('Session B')).toBeInTheDocument()
    })
  })

  it('renders Custom Fields page with dynamic fields', async () => {
    render(<AdminCustomFieldsPage />)
    expect(screen.getByText('Loading custom fields...')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Custom Data Fields')).toBeInTheDocument()
      expect(screen.getByText('T-Shirt Size')).toBeInTheDocument()
    })
  })

  it('renders Exports page with export destinations', () => {
    render(<AdminExportsPage />)
    expect(screen.getByText('Data Exports')).toBeInTheDocument()
    expect(screen.getByText('Google Sheets Sync')).toBeInTheDocument()
    expect(screen.getByText('CSV Download')).toBeInTheDocument()
  })
})
