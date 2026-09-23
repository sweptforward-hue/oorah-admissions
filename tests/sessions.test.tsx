import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SessionACampersPage from '@/app/session-a/campers/page'
import SessionBCampersPage from '@/app/session-b/campers/page'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'John Smith',
          application_number: '1042',
          created_at: new Date().toISOString(),
          session: 'Session A',
          statuses: { name: 'Accepted' },
        },
        {
          id: '2',
          name: 'Sarah Cohen',
          application_number: '1043',
          created_at: new Date().toISOString(),
          session: 'Session B',
          statuses: { name: 'Accepted' },
        },
      ],
      error: null,
    }),
  }),
}))

describe('Session Rosters', () => {
  it('renders Session A campers roster', async () => {
    const Component = await SessionACampersPage()
    render(Component)
    expect(screen.getByText('Session A Campers')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
  })

  it('renders Session B campers roster', async () => {
    const Component = await SessionBCampersPage()
    render(Component)
    expect(screen.getByText('Session B Campers')).toBeInTheDocument()
    expect(screen.getByText('Sarah Cohen')).toBeInTheDocument()
  })
})
