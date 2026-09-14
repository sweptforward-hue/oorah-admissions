import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as auth from '@/lib/auth/authorization'
import { updateCamperStatus, toggleCamperVoting, deleteCamper } from '@/lib/campers/actions'
import {
  sendChatMessage,
  uploadDocumentToDrive,
  castVaadVoteAction,
  generateContractPdf,
  uploadSignedContract,
  uploadPhotoAction,
  uploadVoiceNoteAction,
  uploadTranscriptAction,
  deletePhotoAction,
  deleteVoiceNoteAction,
  deleteTranscriptAction,
  deleteDocumentAction
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
    it('deleteCamper returns structured error when unauthenticated', async () => {
      vi.mocked(auth.requireAdminRole).mockRejectedValue(new Error('Unauthorized: Admin role required'))
      const res = await deleteCamper('kid-1')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Admin role required' })
    })

    it('updateCamperStatus returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await updateCamperStatus('kid-1', 'Accepted', 'Reason')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('toggleCamperVoting returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await toggleCamperVoting('kid-1', true)
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('sendChatMessage returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await sendChatMessage('kid-1', 'Hello')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('uploadDocumentToDrive returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await uploadDocumentToDrive('kid-1', 'doc.pdf')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('deleteDocumentAction returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await deleteDocumentAction('doc-1', 'kid-1')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('castVaadVoteAction returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await castVaadVoteAction('kid-1', 'Accept')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('generateContractPdf returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await generateContractPdf('kid-1')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('uploadSignedContract returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await uploadSignedContract('kid-1')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('uploadPhotoAction returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await uploadPhotoAction('kid-1', 'photo.jpg', '')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('uploadVoiceNoteAction returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await uploadVoiceNoteAction('kid-1', 'audio.webm', '')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('uploadTranscriptAction returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await uploadTranscriptAction('kid-1', 'transcript.pdf', '')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('deletePhotoAction returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await deletePhotoAction('photo-1', 'kid-1')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('deleteVoiceNoteAction returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await deleteVoiceNoteAction('voice-1', 'kid-1')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
    })

    it('deleteTranscriptAction returns structured error when unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await deleteTranscriptAction('transcript-1', 'kid-1')
      expect(res).toEqual({ success: false, error: 'Unauthorized: Authentication required' })
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
