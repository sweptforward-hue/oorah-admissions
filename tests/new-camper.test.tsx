import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NewCamperPage from '@/app/campers/new/page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  redirect: vi.fn(),
  usePathname: () => '/campers/new'
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}))

vi.mock('@/app/campers/new/actions', () => ({
  createCamper: vi.fn().mockResolvedValue({})
}))

describe('New Camper Page', () => {
  it('renders the creation form correctly', () => {
    render(<NewCamperPage />)
    expect(screen.getByText('Create New Camper')).toBeInTheDocument()
    expect(screen.getByLabelText(/Camper Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Application Number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Camper/i })).toBeInTheDocument()
  })

  it('updates form fields on typing', () => {
    render(<NewCamperPage />)
    const nameInput = screen.getByLabelText(/Camper Name/i) as HTMLInputElement
    const appNumInput = screen.getByLabelText(/Application Number/i) as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'Rachel Katz' } })
    fireEvent.change(appNumInput, { target: { value: '1050' } })

    expect(nameInput.value).toBe('Rachel Katz')
    expect(appNumInput.value).toBe('1050')
  })
})
