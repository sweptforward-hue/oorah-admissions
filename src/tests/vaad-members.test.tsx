import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VaadMembersPage from '../app/admin/vaad-members/page'

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            user_id: 'u1',
            is_active: true,
            can_contribute: true,
            can_vote: true,
            user: { id: 'u1', full_name: 'David Cohen', email: 'david@example.com' },
          },
          {
            id: '2',
            user_id: 'u2',
            is_active: true,
            can_contribute: true,
            can_vote: true,
            user: { id: 'u2', full_name: 'Sarah Levy', email: 'sarah@example.com' },
          },
          {
            id: '3',
            user_id: 'u3',
            is_active: true,
            can_contribute: false,
            can_vote: true,
            user: { id: 'u3', full_name: 'Michael Klein', email: 'michael@example.com' },
          },
        ],
        error: null,
      }),
    }),
  },
}))

describe('VAAD Members Admin', () => {
  it('renders the VAAD members returned from Supabase query', async () => {
    render(<VaadMembersPage />)

    await waitFor(() => {
      expect(screen.getByText('David Cohen')).toBeInTheDocument()
      expect(screen.getByText('Sarah Levy')).toBeInTheDocument()
      expect(screen.getByText('Michael Klein')).toBeInTheDocument()
    })
  })
})
