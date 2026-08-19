import { render, screen, fireEvent } from '@testing-library/react'
import NewCamperPage from '@/app/campers/new/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    }
  },
  redirect: jest.fn()
}))

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode, href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock the action
jest.mock('@/app/campers/new/actions', () => ({
  createCamper: jest.fn().mockResolvedValue({})
}));

describe('New Camper Page', () => {
  it('renders the form correctly', () => {
    render(<NewCamperPage />)

    expect(screen.getByText('Create New Camper')).toBeInTheDocument()
    expect(screen.getByLabelText(/Camper Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Application Number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Camper/i })).toBeInTheDocument()
  })

  it('updates form fields when typing', () => {
    render(<NewCamperPage />)

    const nameInput = screen.getByLabelText(/Camper Name/i) as HTMLInputElement
    const appNumInput = screen.getByLabelText(/Application Number/i) as HTMLInputElement

    fireEvent.change(nameInput, { target: { value: 'Rachel Katz' } })
    fireEvent.change(appNumInput, { target: { value: '1050' } })

    expect(nameInput.value).toBe('Rachel Katz')
    expect(appNumInput.value).toBe('1050')
  })
})
