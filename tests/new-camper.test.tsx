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

describe('New Camper Page - End-to-End Intake Form', () => {
  it('renders all 4 intake sections correctly', () => {
    render(<NewCamperPage />)
    expect(screen.getByText('Camper Intake & Registration Form')).toBeInTheDocument()

    // 1. Personal Information
    expect(screen.getByText('1. Personal Information')).toBeInTheDocument()
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Application Number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Gender/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument()

    // 2. Family Contacts
    expect(screen.getByText('2. Family Contacts')).toBeInTheDocument()
    expect(screen.getByLabelText(/Father's Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mother's Full Name/i)).toBeInTheDocument()

    // 3. Medical Notes
    expect(screen.getByText('3. Medical Notes & Health Requirements')).toBeInTheDocument()
    expect(screen.getByLabelText(/Medical \/ Health Notes & Conditions/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Allergies & Dietary Restrictions/i)).toBeInTheDocument()

    // 4. Intake Questionnaire
    expect(screen.getByText('4. Intake Questionnaire & Admissions Notes')).toBeInTheDocument()
    expect(screen.getByLabelText(/Behavioral, Social & Educational Notes/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Complete Intake & Create Workspace/i })).toBeInTheDocument()
  })

  it('updates input fields across sections on typing', () => {
    render(<NewCamperPage />)
    const firstNameInput = screen.getByLabelText(/First Name/i) as HTMLInputElement
    const lastNameInput = screen.getByLabelText(/Last Name/i) as HTMLInputElement
    const appNumInput = screen.getByLabelText(/Application Number/i) as HTMLInputElement
    const fatherNameInput = screen.getByLabelText(/Father's Full Name/i) as HTMLInputElement
    const allergiesInput = screen.getByLabelText(/Allergies & Dietary Restrictions/i) as HTMLInputElement

    fireEvent.change(firstNameInput, { target: { value: 'Rachel' } })
    fireEvent.change(lastNameInput, { target: { value: 'Katz' } })
    fireEvent.change(appNumInput, { target: { value: 'APP-1050' } })
    fireEvent.change(fatherNameInput, { target: { value: 'Joseph Katz' } })
    fireEvent.change(allergiesInput, { target: { value: 'Nut allergy' } })

    expect(firstNameInput.value).toBe('Rachel')
    expect(lastNameInput.value).toBe('Katz')
    expect(appNumInput.value).toBe('APP-1050')
    expect(fatherNameInput.value).toBe('Joseph Katz')
    expect(allergiesInput.value).toBe('Nut allergy')
  })
})
