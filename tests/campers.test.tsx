import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CampersDashboard from '@/app/campers/page'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => {
  const mockClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          application_number: '1042',
          name: 'John Smith',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          statuses: { name: 'VAAD Review' }
        },
        {
          id: '2',
          application_number: '1043',
          name: 'Sarah Cohen',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          statuses: { name: 'Accepted' }
        }
      ],
      error: null
    })
  }
  return {
    createClient: vi.fn().mockResolvedValue(mockClient),
    createServerSupabaseClient: vi.fn().mockResolvedValue(mockClient)
  }
})

describe('Campers Dashboard', () => {
  it('renders the dashboard heading', async () => {
    const DashboardComponent = await CampersDashboard()
    render(DashboardComponent)
    expect(screen.getByRole('heading', { name: /Campers Roster & Admissions/i })).toBeInTheDocument()
  })

  it('renders the Create New Camper button', async () => {
    const DashboardComponent = await CampersDashboard()
    render(DashboardComponent)
    const button = screen.getByText('+ New Kid')
    expect(button).toBeInTheDocument()
    expect(button.closest('a')).toHaveAttribute('href', '/campers/new')
  })

  it('renders camper records from database', async () => {
    const DashboardComponent = await CampersDashboard()
    render(DashboardComponent)
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('1042')).toBeInTheDocument()
    expect(screen.getByText('Sarah Cohen')).toBeInTheDocument()
  })
})
