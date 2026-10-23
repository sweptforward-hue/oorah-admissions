import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VaadMembersPage from '../app/admin/vaad-members/page'
import { supabase } from '@/lib/supabase/client'

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('VAAD Members Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders clean empty state when no members exist in database', async () => {
    ;(supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })

    render(<VaadMembersPage />)

    await waitFor(() => {
      expect(
        screen.getByText('No VAAD members configured yet. Assign members from the Staff Directory.')
      ).toBeInTheDocument()
    })
  })

  it('renders properly mocked VAAD members from database', async () => {
    ;(supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'm1',
            user_id: 'u1',
            is_active: true,
            can_contribute: true,
            can_vote: true,
            user: { id: 'u1', name: 'Rabbi Aaron', email: 'aaron@example.com' },
          },
        ],
        error: null,
      }),
    })

    render(<VaadMembersPage />)

    await waitFor(() => {
      expect(screen.getByText('Rabbi Aaron')).toBeInTheDocument()
      expect(screen.getByLabelText('Toggle VAAD Member status for Rabbi Aaron')).toBeInTheDocument()
    })
  })
})
