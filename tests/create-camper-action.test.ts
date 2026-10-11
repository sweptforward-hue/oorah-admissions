import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCamper } from '@/app/campers/new/actions'

const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } })
  },
  from: vi.fn((table: string) => {
    if (table === 'statuses') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'status-new-id' } })
          }),
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'status-new-id' } })
          })
        })
      }
    }
    if (table === 'kids') {
      return {
        insert: mockInsert.mockReturnValue({
          select: mockSelect.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: { id: 'kid-999', name: 'Jacob Miller', application_number: '1234' },
              error: null
            })
          })
        })
      }
    }
    if (table === 'status_history' || table === 'audit_log') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null })
      }
    }
    return {}
  })
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createAdminClient: vi.fn(() => mockSupabase)
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  })
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('createCamper Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error if required fields are missing', async () => {
    const formData = new FormData()
    formData.append('name', '')
    formData.append('applicationNumber', '')

    const res = await createCamper(formData)
    expect(res).toEqual({ error: 'Name and Application Number are required' })
  })

  it('inserts kid record with split name and redirects', async () => {
    const formData = new FormData()
    formData.append('name', 'Jacob Miller')
    formData.append('applicationNumber', '1234')

    try {
      await createCamper(formData)
    } catch (e: unknown) {
      expect((e as Error).message).toBe('NEXT_REDIRECT:/campers/kid-999')
    }

    expect(mockInsert).toHaveBeenCalledWith([
      {
        name: 'Jacob Miller',
        first_name: 'Jacob',
        last_name: 'Miller',
        application_number: '1234',
        status_id: 'status-new-id'
      }
    ])
  })
})
