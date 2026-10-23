/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as auth from '@/lib/auth/authorization'
import { deleteUser } from '@/lib/users/actions'
import { deleteCamper } from '@/lib/campers/actions'
import { deleteStaffMember } from '@/lib/staff/actions'

const mockAuditInsert = vi.fn().mockResolvedValue({ data: null, error: null })
const mockKidsDelete = vi.fn().mockResolvedValue({ data: null, error: null })
const mockUsersDelete = vi.fn().mockResolvedValue({ data: null, error: null })
const mockStaffDelete = vi.fn().mockResolvedValue({ data: null, error: null })
const mockVaadMembersDelete = vi.fn().mockResolvedValue({ data: null, error: null })
const mockStaffUpdate = vi.fn().mockResolvedValue({ data: null, error: null })
const mockDependentDelete = vi.fn().mockResolvedValue({ data: null, error: null })

let usersDeleteError: { message: string } | null = null
let kidsDeleteError: { message: string } | null = null
let staffDeleteError: { message: string } | null = null

vi.mock('@/lib/auth/authorization', () => ({
  requireAdminRole: vi.fn(),
  getCurrentUser: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => {
  const createMockDb = () => ({
    from: (table: string) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col: string, val: string) => {
          if (table === 'users' && builder._action === 'delete') {
            mockUsersDelete(col, val)
            return Promise.resolve({ error: usersDeleteError })
          }
          if (table === 'kids' && builder._action === 'delete') {
            mockKidsDelete(col, val)
            return Promise.resolve({ error: kidsDeleteError })
          }
          if (table === 'staff' && builder._action === 'delete') {
            mockStaffDelete(col, val)
            return Promise.resolve({ error: staffDeleteError })
          }
          if (table === 'vaad_members' && builder._action === 'delete') {
            mockVaadMembersDelete(col, val)
            return Promise.resolve({ error: null })
          }
          if (table === 'staff' && builder._action === 'update') {
            mockStaffUpdate(col, val)
            return Promise.resolve({ error: null })
          }
          if (builder._action === 'delete') {
            mockDependentDelete(table, col, val)
            return Promise.resolve({ error: null })
          }
          return builder
        }),
        delete: vi.fn().mockImplementation(() => {
          builder._action = 'delete'
          return builder
        }),
        update: vi.fn().mockImplementation((payload: any) => {
          builder._action = 'update'
          builder._updatePayload = payload
          return builder
        }),
        insert: vi.fn().mockImplementation((payload: any) => {
          if (table === 'audit_log') {
            mockAuditInsert(payload)
          }
          return Promise.resolve({ data: null, error: null })
        }),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === 'users') {
            return Promise.resolve({
              data: { email: 'target.user@oorah.org', full_name: 'Target User', role: 'staff' },
              error: null,
            })
          }
          if (table === 'kids') {
            return Promise.resolve({
              data: {
                name: 'Chaim Cohen',
                application_number: 'APP-10023',
                first_name: 'Chaim',
                last_name: 'Cohen',
              },
              error: null,
            })
          }
          if (table === 'staff') {
            return Promise.resolve({
              data: {
                name: 'Yossi Green',
                application_number: 'STF-8812',
                first_name: 'Yossi',
                last_name: 'Green',
                bunk_assignment: 'Bunk B-4',
                session: 'Session B',
              },
              error: null,
            })
          }
          return Promise.resolve({ data: null, error: null })
        }),
        single: vi.fn().mockImplementation(() => {
          if (table === 'kids') {
            return Promise.resolve({
              data: {
                name: 'Chaim Cohen',
                application_number: 'APP-10023',
                first_name: 'Chaim',
                last_name: 'Cohen',
              },
              error: null,
            })
          }
          return Promise.resolve({ data: null, error: null })
        }),
      }
      return builder
    },
  })

  return {
    createServerSupabaseClient: () => createMockDb(),
    createAdminClient: () => createMockDb(),
  }
})

describe('Universal Deletion & Security Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usersDeleteError = null
    kidsDeleteError = null
    staffDeleteError = null
  })

  describe('User Deletion (deleteUser)', () => {
    it('strictly denies deletion when caller lacks admin authorization', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin privileges required'))

      const res = await deleteUser('user-target-123')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Unauthorized')
      expect(mockUsersDelete).not.toHaveBeenCalled()
      expect(mockAuditInsert).not.toHaveBeenCalled()
    })

    it('successfully cascades deletion, cleans up VAAD seats, and records audit trail', async () => {
      vi.mocked(auth.requireAdminRole).mockResolvedValue({
        id: 'admin-super-1',
        role: 'admin',
        name: 'Chief Administrator',
      } as any)

      const res = await deleteUser('user-target-123')
      expect(res.success).toBe(true)

      // 1. Checks that associated VAAD seats were removed
      expect(mockVaadMembersDelete).toHaveBeenCalledWith('user_id', 'user-target-123')

      // 2. Checks that user account was deleted
      expect(mockUsersDelete).toHaveBeenCalledWith('id', 'user-target-123')

      // 3. Checks that immutable audit entry was recorded
      expect(mockAuditInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: 'admin-super-1',
          action: 'DELETE_USER',
          entity_type: 'user',
          entity_id: 'user-target-123',
          details: expect.objectContaining({
            email: 'target.user@oorah.org',
            full_name: 'Target User',
            role: 'staff',
          }),
        })
      )
    })

    it('gracefully handles database deletion error', async () => {
      vi.mocked(auth.requireAdminRole).mockResolvedValue({ id: 'admin-super-1', role: 'admin' } as any)
      usersDeleteError = { message: 'Database foreign key constraint violation' }

      const res = await deleteUser('user-target-123')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Failed to delete user: Database foreign key constraint violation')
    })
  })

  describe('Camper Deletion (deleteCamper)', () => {
    it('strictly denies deletion when caller lacks admin authorization', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))

      const res = await deleteCamper('kid-target-456')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Unauthorized')
      expect(mockKidsDelete).not.toHaveBeenCalled()
      expect(mockAuditInsert).not.toHaveBeenCalled()
    })

    it('successfully cleans up dependent records across all media/notes/votes tables and audits deletion', async () => {
      vi.mocked(auth.requireAdminRole).mockResolvedValue({
        id: 'admin-super-1',
        role: 'admin',
        name: 'Chief Administrator',
      } as any)

      const res = await deleteCamper('kid-target-456')
      expect(res.success).toBe(true)

      // 1. Checks that dependent tables were cleaned up
      expect(mockDependentDelete).toHaveBeenCalledWith(expect.stringMatching(/photos|documents|voice_notes|transcripts|contacts|notes|custom_fields|votes|history/), 'kid_id', 'kid-target-456')

      // 2. Checks that camper record was deleted from kids table
      expect(mockKidsDelete).toHaveBeenCalledWith('id', 'kid-target-456')

      // 3. Checks that immutable audit entry was recorded
      expect(mockAuditInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: 'admin-super-1',
          action: 'DELETE_CAMPER',
          entity_type: 'kid',
          entity_id: 'kid-target-456',
          details: expect.objectContaining({
            camper_name: 'Chaim Cohen',
            application_number: 'APP-10023',
          }),
        })
      )
    })

    it('gracefully handles database deletion failure', async () => {
      vi.mocked(auth.requireAdminRole).mockResolvedValue({ id: 'admin-super-1', role: 'admin' } as any)
      kidsDeleteError = { message: 'Row-level locking timeout' }

      const res = await deleteCamper('kid-target-456')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Failed to delete camper: Row-level locking timeout')
    })
  })

  describe('Staff Deletion (deleteStaffMember)', () => {
    it('strictly denies deletion when caller lacks admin authorization', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin privileges required'))

      const res = await deleteStaffMember('staff-target-789')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Unauthorized')
      expect(mockStaffDelete).not.toHaveBeenCalled()
      expect(mockAuditInsert).not.toHaveBeenCalled()
    })

    it('successfully cleans up bunk assignments, deletes staff member, and audits deletion', async () => {
      vi.mocked(auth.requireAdminRole).mockResolvedValue({
        id: 'admin-super-1',
        role: 'admin',
        name: 'Chief Administrator',
      } as any)

      const res = await deleteStaffMember('staff-target-789')
      expect(res.success).toBe(true)

      // 1. Checks that bunk assignments were cleaned up
      expect(mockStaffUpdate).toHaveBeenCalledWith('id', 'staff-target-789')

      // 2. Checks that staff record was deleted
      expect(mockStaffDelete).toHaveBeenCalledWith('id', 'staff-target-789')

      // 3. Checks that immutable audit entry was recorded
      expect(mockAuditInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          actor_id: 'admin-super-1',
          action: 'DELETE_STAFF_MEMBER',
          entity_type: 'staff',
          entity_id: 'staff-target-789',
          details: expect.objectContaining({
            staff_name: 'Yossi Green',
            application_number: 'STF-8812',
            bunk_assignment: 'Bunk B-4',
            session: 'Session B',
          }),
        })
      )
    })

    it('gracefully handles database deletion failure', async () => {
      vi.mocked(auth.requireAdminRole).mockResolvedValue({ id: 'admin-super-1', role: 'admin' } as any)
      staffDeleteError = { message: 'Network connection failed' }

      const res = await deleteStaffMember('staff-target-789')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Failed to delete staff member: Network connection failed')
    })
  })
})
