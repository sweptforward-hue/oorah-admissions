import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as auth from '@/lib/auth/authorization'
import { deleteCamper } from '@/lib/campers/actions'

const mockDeleteEq = vi.fn().mockResolvedValue({ error: null })
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockMaybeSingle = vi.fn().mockResolvedValue({
  data: { id: 'kid-123', name: 'Test Camper', application_number: '1001', first_name: 'Test', last_name: 'Camper' }
})

vi.mock('@/lib/auth/authorization', async (importOriginal) => {
  const actual = await importOriginal<typeof auth>()
  return {
    ...actual,
    requireAdminRole: vi.fn()
  }
})

vi.mock('@/lib/supabase/server', () => {
  const mockAdminClient = {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle
        })
      }),
      delete: () => ({
        eq: (...args: unknown[]) => mockDeleteEq(table, ...args)
      }),
      insert: mockInsert
    })
  }

  return {
    createAdminClient: () => mockAdminClient,
    createServerSupabaseClient: () => mockAdminClient
  }
})

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('deleteCamper Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails cleanly when non-admin user attempts deletion', async () => {
    vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))

    const result = await deleteCamper('kid-123')
    expect(result).toEqual({ success: false, error: 'Unauthorized: Admin role required' })
    expect(mockDeleteEq).not.toHaveBeenCalled()
  })

  it('successfully deletes camper and cascades child table dependencies', async () => {
    vi.mocked(auth.requireAdminRole).mockResolvedValue({ id: 'admin-user-1', email: 'admin@oorah.org', role: 'admin' })

    const result = await deleteCamper('kid-123')
    expect(result).toEqual({ success: true })

    // Verify child tables were deleted
    const deletedTables = mockDeleteEq.mock.calls.map(call => call[0])
    expect(deletedTables).toContain('photos')
    expect(deletedTables).toContain('voice_notes')
    expect(deletedTables).toContain('transcripts')
    expect(deletedTables).toContain('documents')
    expect(deletedTables).toContain('chat_messages')
    expect(deletedTables).toContain('vaad_votes')
    expect(deletedTables).toContain('status_history')
    expect(deletedTables).toContain('custom_field_values')
    expect(deletedTables).toContain('kids')

    // Verify audit log entry inserted
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'admin-user-1',
        action: 'DELETE_CAMPER',
        entity_type: 'kid',
        entity_id: 'kid-123',
        details: expect.objectContaining({ camper_name: 'Test Camper' })
      })
    )
  })
})
