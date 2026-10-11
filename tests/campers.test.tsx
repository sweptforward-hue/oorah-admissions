import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import CampersDashboard from '@/app/campers/page'

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
})

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}))

// Mock Supabase server client
const mockKidsData = [
  {
    id: '1',
    application_number: '1042',
    name: 'John Smith',
    session: 'Session A',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    statuses: { name: 'VAAD Review' }
  },
  {
    id: '2',
    application_number: '1043',
    name: 'Sarah Cohen',
    session: 'Session B',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    statuses: { name: 'Accepted' }
  }
]

vi.mock('@/lib/supabase/server', () => {
  return {
    createClient: vi.fn().mockImplementation(async () => {
      const mockQueryBuilder: Record<string, unknown> = {
        select: vi.fn().mockImplementation(() => mockQueryBuilder),
        order: vi.fn().mockImplementation(() => mockQueryBuilder),
        or: vi.fn().mockImplementation(() => mockQueryBuilder),
        eq: vi.fn().mockImplementation(() => mockQueryBuilder),
        range: vi.fn().mockResolvedValue({
          data: mockKidsData,
          count: 2,
          error: null
        }),
        then: vi.fn().mockImplementation((callback) => callback({
          data: [{ name: 'Accepted' }, { name: 'VAAD Review' }],
          error: null
        }))
      }

      return {
        from: vi.fn().mockReturnValue(mockQueryBuilder)
      }
    }),
    createServerSupabaseClient: vi.fn()
  }
})

describe('Campers Dashboard', () => {
  it('renders the dashboard heading', async () => {
    const DashboardComponent = await CampersDashboard({})
    render(DashboardComponent)
    expect(screen.getByRole('heading', { name: /Campers Roster & Admissions/i })).toBeInTheDocument()
  })

  it('renders the Create New Camper button', async () => {
    const DashboardComponent = await CampersDashboard({})
    render(DashboardComponent)
    const button = screen.getByText('+ New Kid')
    expect(button).toBeInTheDocument()
    expect(button.closest('a')).toHaveAttribute('href', '/campers/new')
  })

  it('renders filter form with search, session, and status controls', async () => {
    const DashboardComponent = await CampersDashboard({
      searchParams: Promise.resolve({ query: 'Sarah', session: 'Session B', status: 'Accepted' })
    })
    render(DashboardComponent)

    const searchInput = screen.getByPlaceholderText(/Search by name or app #/i)
    expect(searchInput).toHaveValue('Sarah')

    const sessionSelect = screen.getByRole('combobox', { name: /Filter by session/i })
    expect(sessionSelect).toHaveValue('Session B')

    const statusSelect = screen.getByRole('combobox', { name: /Filter by status/i })
    expect(statusSelect).toHaveValue('Accepted')
  })

  it('renders camper records from database', async () => {
    const DashboardComponent = await CampersDashboard({})
    render(DashboardComponent)
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('1042')).toBeInTheDocument()
    expect(screen.getByText('Sarah Cohen')).toBeInTheDocument()
  })
})
