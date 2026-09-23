import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AdminYearsPage from '@/app/admin/years/page'
import AdminSessionsPage from '@/app/admin/sessions/page'
import AdminCustomFieldsPage from '@/app/admin/custom-fields/page'
import AdminExportsPage from '@/app/admin/exports/page'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}))

vi.mock('@/lib/custom-fields/actions', () => ({
  getCustomFields: vi.fn().mockResolvedValue([
    { id: '1', name: 't_shirt_size', label: 'T-Shirt Size', field_type: 'dropdown', required: true, options: { entity_type: 'camper', choices: ['S', 'M', 'L', 'XL'] } },
    { id: '2', name: 'dietary_restrictions', label: 'Dietary Restrictions', field_type: 'text', required: false, options: { entity_type: 'camper' } },
  ]),
  createCustomField: vi.fn(),
  updateCustomField: vi.fn(),
  deleteCustomField: vi.fn(),
}))

describe('Admin Management Modules', () => {
  it('renders Years page with active year items', () => {
    render(<AdminYearsPage />)
    expect(screen.getByText('Manage Operational Years')).toBeInTheDocument()
    expect(screen.getByText('Summer 2025')).toBeInTheDocument()
  })

  it('renders Sessions page with Session A and B', () => {
    render(<AdminSessionsPage />)
    expect(screen.getByText('Manage Camp Sessions')).toBeInTheDocument()
    expect(screen.getByText('Session A')).toBeInTheDocument()
    expect(screen.getByText('Session B')).toBeInTheDocument()
  })

  it('renders Custom Fields page with dynamic fields', async () => {
    render(<AdminCustomFieldsPage />)
    expect(screen.getByText('Custom Data Fields')).toBeInTheDocument()
    await waitFor(() => {
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
