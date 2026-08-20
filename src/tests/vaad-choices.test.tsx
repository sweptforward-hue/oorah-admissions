import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VaadChoicesPage from '../app/admin/vaad-choices/page'

vi.mock('@/lib/supabase/client', () => {
  const mockOrder = vi.fn().mockResolvedValue({
    data: [
      { id: '1', name: 'Accept', is_active: true, display_order: 10 },
      { id: '2', name: 'Reject', is_active: true, display_order: 20 },
    ],
    error: null
  })
  const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockResolvedValue({ error: null }),
      })
    }
  }
})

describe('VAAD Choices Admin', () => {
  it('renders the VAAD choices', async () => {
    render(<VaadChoicesPage />)

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument()
      expect(screen.getByText('Reject')).toBeInTheDocument()
    })
  })
})
