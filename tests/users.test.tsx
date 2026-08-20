import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import StaffPage from '@/app/admin/users/page'

vi.mock('@/lib/users/actions', () => ({
  getUsersWithVaadInfo: vi.fn(),
  updateUser: vi.fn(),
  updateVaadPermissions: vi.fn()
}))

import { getUsersWithVaadInfo, updateUser, updateVaadPermissions } from '@/lib/users/actions'

describe('StaffPage', () => {
  const mockUsers = [
    {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'staff',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vaad_member: null
    },
    {
      id: '2',
      email: 'vaad@example.com',
      name: 'Vaad User',
      role: 'user',
      active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      vaad_member: {
        id: 'v1',
        user_id: '2',
        is_active: true,
        can_contribute: true,
        can_vote: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  ]

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getUsersWithVaadInfo).mockResolvedValue(mockUsers)
  })

  it('renders loading state initially', () => {
    // Make getUsersWithVaadInfo not resolve immediately
    vi.mocked(getUsersWithVaadInfo).mockImplementation(() => new Promise(() => {}))
    render(<StaffPage />)
    expect(screen.getByText('Loading users...')).toBeInTheDocument()
  })

  it('renders users table after loading', async () => {
    render(<StaffPage />)

    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument()
    })

    expect(screen.getByText('Staff Management')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Vaad User')).toBeInTheDocument()

    // Status buttons
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Deactivated')).toBeInTheDocument()
  })

  it('calls updateUser when toggling status', async () => {
    vi.mocked(updateUser).mockResolvedValue({ success: true })

    render(<StaffPage />)

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    const activeButton = screen.getByText('Active')
    fireEvent.click(activeButton)

    expect(updateUser).toHaveBeenCalledWith('1', { active: false })
  })

  it('calls updateVaadPermissions when changing VAAD member checkbox', async () => {
    vi.mocked(updateVaadPermissions).mockResolvedValue({ success: true })

    render(<StaffPage />)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    // test@example.com is first. VAAD Member is the first checkbox for them.
    const vaadMemberCheckbox = checkboxes[0]

    expect(vaadMemberCheckbox.checked).toBe(false)
    fireEvent.click(vaadMemberCheckbox)

    expect(updateVaadPermissions).toHaveBeenCalledWith('1', {
      isVaadMember: true,
      canContribute: false,
      canVote: false
    })
  })

  it('calls updateVaadPermissions when changing Can Contribute checkbox', async () => {
    vi.mocked(updateVaadPermissions).mockResolvedValue({ success: true })

    render(<StaffPage />)

    await waitFor(() => {
      expect(screen.getByText('Vaad User')).toBeInTheDocument()
    })

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    // Vaad User is second. Their checkboxes are 3, 4, 5
    const canContributeCheckbox = checkboxes[4]

    expect(canContributeCheckbox.checked).toBe(true)
    fireEvent.click(canContributeCheckbox)

    expect(updateVaadPermissions).toHaveBeenCalledWith('2', {
      isVaadMember: true,
      canContribute: false,
      canVote: false
    })
  })
})
