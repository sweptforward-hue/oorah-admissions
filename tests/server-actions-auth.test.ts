import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as auth from '@/lib/auth/authorization'
import { updateCamperStatus, toggleCamperVoting } from '@/lib/campers/actions'
import {
  sendChatMessage,
  uploadDocumentToDrive,
  castVaadVoteAction,
  generateContractPdf,
  uploadSignedContract
} from '@/lib/campers/detail-actions'
import {
  toggleVaadMemberPermission,
  createYear,
  updateYear,
  createSession,
  updateSessionSchedule,
  triggerExport,
  updateDriveFolder,
  testDriveConnection
} from '@/lib/admin/actions'
import { createCustomField, updateCustomField } from '@/lib/custom-fields/actions'

vi.mock('@/lib/auth/authorization', async (importOriginal) => {
  const actual = await importOriginal<typeof auth>()
  return {
    ...actual,
    getCurrentUser: vi.fn(),
    requireAdminRole: vi.fn()
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { id: 'status-123' } }),
          order: () => ({ data: [] })
        }),
        ilike: () => ({
          limit: () => ({
            single: async () => ({ data: { id: 'choice-123' } })
          })
        }),
        order: () => ({ data: [] })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: 'inserted-123' } })
        })
      }),
      update: () => ({
        eq: async () => ({ error: null }),
        select: () => ({
          single: async () => ({ data: { id: 'updated-123' } })
        })
      }),
      delete: () => ({
        eq: async () => ({ error: null })
      })
    })
  })
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

vi.mock('@/lib/vaad/actions', () => ({
  submitVote: vi.fn().mockResolvedValue({ success: true })
}))

describe('Server Actions Authorization Checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Camper Actions Null Actor Handling', () => {
    it('updateCamperStatus throws error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      await expect(updateCamperStatus('kid-1', 'Accepted', 'Reason')).rejects.toThrow('Unauthorized: Authentication required')
    })

    it('toggleCamperVoting throws error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      await expect(toggleCamperVoting('kid-1', true)).rejects.toThrow('Unauthorized: Authentication required')
    })

    it('sendChatMessage throws error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      await expect(sendChatMessage('kid-1', 'Hello')).rejects.toThrow('Unauthorized: Authentication required')
    })

    it('uploadDocumentToDrive throws error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      await expect(uploadDocumentToDrive('kid-1', 'doc.pdf')).rejects.toThrow('Unauthorized: Authentication required')
    })

    it('castVaadVoteAction throws error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      await expect(castVaadVoteAction('kid-1', 'Accept')).rejects.toThrow('Unauthorized: Authentication required')
    })

    it('generateContractPdf throws error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      await expect(generateContractPdf('kid-1')).rejects.toThrow('Unauthorized: Authentication required')
    })

    it('uploadSignedContract throws error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      await expect(uploadSignedContract('kid-1')).rejects.toThrow('Unauthorized: Authentication required')
    })
  })

  describe('Admin Actions Role Enforcement', () => {
    it('toggleVaadMemberPermission calls requireAdminRole', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      await expect(toggleVaadMemberPermission('m-1', 'is_active', true)).rejects.toThrow('Unauthorized: Admin role required')
    })

    it('createYear calls requireAdminRole', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      await expect(createYear('Summer 2026')).rejects.toThrow('Unauthorized: Admin role required')
    })

    it('updateYear calls requireAdminRole', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      await expect(updateYear('y-1', { is_active: false })).rejects.toThrow('Unauthorized: Admin role required')
    })

    it('createSession calls requireAdminRole', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      await expect(createSession({ name: 'S1', start_date: '2025-06-01', end_date: '2025-06-15' })).rejects.toThrow('Unauthorized: Admin role required')
    })

    it('updateSessionSchedule calls requireAdminRole', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      await expect(updateSessionSchedule('s-1', '2025-06-01', '2025-06-15')).rejects.toThrow('Unauthorized: Admin role required')
    })

    it('triggerExport calls requireAdminRole', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      await expect(triggerExport('CSV')).rejects.toThrow('Unauthorized: Admin role required')
    })

    it('updateDriveFolder calls requireAdminRole', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      await expect(updateDriveFolder('folder-1')).rejects.toThrow('Unauthorized: Admin role required')
    })

    it('testDriveConnection calls requireAdminRole', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      await expect(testDriveConnection()).rejects.toThrow('Unauthorized: Admin role required')
    })
  })

  describe('Custom Field Actions Role Enforcement', () => {
    it('createCustomField calls requireAdminRole', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      await expect(createCustomField({ name: 'test', label: 'Test', field_type: 'text', required: false })).rejects.toThrow('Unauthorized: Admin role required')
    })

    it('updateCustomField calls requireAdminRole', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      await expect(updateCustomField('cf-1', { label: 'New Label' })).rejects.toThrow('Unauthorized: Admin role required')
    })
  })
})
