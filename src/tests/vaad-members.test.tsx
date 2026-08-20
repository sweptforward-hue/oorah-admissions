import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VaadMembersPage from '../app/admin/vaad-members/page'

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: 'mocked error to trigger fallback' }),
    })
  }
}))

describe('VAAD Members Admin', () => {
  it('renders the VAAD members according to spec #69', async () => {
    render(<VaadMembersPage />)

    await waitFor(() => {
      expect(screen.getByText('David Cohen')).toBeInTheDocument()
      expect(screen.getByText('Sarah Levy')).toBeInTheDocument()
      expect(screen.getByText('Michael Klein')).toBeInTheDocument()
    })
  })
})
