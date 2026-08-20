import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CampersDashboard from '@/app/campers/page'

// Mock next/link
vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode, href: string }) => {
      return <a href={href}>{children}</a>;
    }
  };
});

// Mock the server Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
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
  }),
  createServerSupabaseClient: vi.fn()
}));

describe('Campers Dashboard', () => {
  it('renders the dashboard heading', async () => {
    const DashboardComponent = await CampersDashboard()
    render(DashboardComponent)
    const heading = screen.getByRole('heading', { name: /Admissions/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the Create New Camper button', async () => {
    const DashboardComponent = await CampersDashboard()
    render(DashboardComponent)
    const button = screen.getByText('+ New Kid')
    expect(button).toBeInTheDocument()
    expect(button.closest('a')).toHaveAttribute('href', '/campers/new')
  })

  it('renders a list of campers from database mock', async () => {
    const DashboardComponent = await CampersDashboard()
    render(DashboardComponent)
    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('1042')).toBeInTheDocument()
    expect(screen.getByText('VAAD Review')).toBeInTheDocument()

    expect(screen.getByText('Sarah Cohen')).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
  })
})
