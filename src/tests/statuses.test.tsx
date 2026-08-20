import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import StatusesPage from '../app/admin/statuses/page'

vi.mock('@/lib/supabase/client', () => {
  const mockOrder = vi.fn().mockResolvedValue({
    data: [
      { id: '1', name: 'New', active: true, display_order: 10, is_default: true },
      { id: '2', name: 'Under Review', active: true, display_order: 20, is_default: false },
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

describe('Statuses Admin', () => {
  it('renders the statuses', async () => {
    render(<StatusesPage />)

    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Under Review')).toBeInTheDocument()
      expect(screen.getByText('Default')).toBeInTheDocument()
    })
  })
})
