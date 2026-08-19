import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import VaadChoicesPage from '../app/admin/vaad-choices/page'

vi.mock('@/lib/supabase/client', () => {
  const mockUpdate = vi.fn().mockResolvedValue({ error: null })
  const mockSelect = vi.fn().mockReturnValue({
    order: vi.fn().mockResolvedValue({
      data: [
        { id: '1', name: 'Accept', is_active: true, display_order: 10 },
        { id: '2', name: 'Reject', is_active: true, display_order: 20 },
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
    // newChoiceName is inputs[0], editName is inputs[1] because we render the edit fields inside the map
    // but actually, we render the "Add Choice" inputs only conditionally if isAdding is true.
    // So if isAdding is false, the edit input is the only one.
    expect(inputs[0]).toHaveValue('Accept')

    const numberInputs = screen.getAllByRole('spinbutton')
    expect(numberInputs[0]).toHaveValue(10)

    fireEvent.change(inputs[0], { target: { value: 'Strong Accept' } })
    fireEvent.change(numberInputs[0], { target: { value: '5' } })

    const saveButton = screen.getByText('Save')
    fireEvent.click(saveButton)
  })
})
