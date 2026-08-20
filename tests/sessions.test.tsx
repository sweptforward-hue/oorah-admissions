import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SessionACampersPage from '@/app/session-a/campers/page'
import SessionBCampersPage from '@/app/session-b/campers/page'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}))

describe('Session Rosters', () => {
  it('renders Session A campers roster', () => {
    render(<SessionACampersPage />)
    expect(screen.getByText('Session A Campers')).toBeInTheDocument()
    expect(screen.getByText('John Smith')).toBeInTheDocument()
  })

  it('renders Session B campers roster', () => {
    render(<SessionBCampersPage />)
    expect(screen.getByText('Session B Campers')).toBeInTheDocument()
    expect(screen.getByText('Sarah Cohen')).toBeInTheDocument()
  })
})
