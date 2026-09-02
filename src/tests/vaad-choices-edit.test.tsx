import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import VaadChoicesPage from '../app/admin/vaad-choices/page'

vi.mock('@/lib/supabase/client', () => {
  const mockUpdate = vi.fn().mockResolvedValue({ error: null })
  const mockSelect = vi.fn().mockReturnValue({
    order: vi.fn().mockResolvedValue({
      data: [
        { id: '1', label: 'Accept', active: true, sort_order: 10 },
        { id: '2', label: 'Reject', active: true, sort_order: 20 },
      ],
      error: null
    })
  })

  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({
          eq: mockUpdate
        }),
      })
    }
  }
})

describe('VAAD Choices Admin Edit', () => {
  it('allows editing a choice', async () => {
    render(<VaadChoicesPage />)

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])

    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveValue('Accept')

    const numberInputs = screen.getAllByRole('spinbutton')
    expect(numberInputs[0]).toHaveValue(10)

    fireEvent.change(inputs[0], { target: { value: 'Strong Accept' } })
    fireEvent.change(numberInputs[0], { target: { value: '5' } })

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)
  })
})
