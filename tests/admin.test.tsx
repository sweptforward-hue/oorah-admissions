import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import AdminYearsPage from '@/app/admin/years/page'
import AdminSessionsPage from '@/app/admin/sessions/page'
import AdminCustomFieldsPage from '@/app/admin/custom-fields/page'
import AdminExportsPage from '@/app/admin/exports/page'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}))

afterEach(() => {
  cleanup()
})

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

  it('renders Custom Fields page with clean state', () => {
    render(<AdminCustomFieldsPage />)
    expect(screen.getByText('Custom Data Fields')).toBeInTheDocument()
    expect(screen.getByText('No Custom Fields')).toBeInTheDocument()
  })

  it('renders Exports page with export destinations', () => {
    render(<AdminExportsPage />)
    expect(screen.getByText('Data Exports')).toBeInTheDocument()
    expect(screen.getByText('Google Sheets Sync')).toBeInTheDocument()
    expect(screen.getByText('CSV Download')).toBeInTheDocument()
  })
})
