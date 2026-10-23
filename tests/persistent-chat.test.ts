import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CamperDetailClient, ChatMessage } from '@/components/campers/camper-detail-client'
import * as auth from '@/lib/auth/authorization'
import { sendChatMessage, getCamperChatMessages } from '@/lib/campers/detail-actions'

// Mock next/navigation & next/link
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}))

// Mock Supabase Server Client & Auth
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockSingle = vi.fn()

const mockSupabaseInstance = {
  from: vi.fn((table: string) => {
    if (table === 'chat_messages') {
      return {
        insert: mockInsert.mockImplementation((payload: any) => ({
          select: mockSelect.mockReturnValue({
            single: mockSingle.mockResolvedValue({
              data: {
                id: 'cm-real-123',
                ...payload,
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        })),
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder.mockResolvedValue({
              data: [
                {
                  id: 'cm-fetched-1',
                  kid_id: 'camper-101',
                  content: 'Note for @Azriel',
                  audio_url: null,
                  attachment_url: null,
                  tagged_users: ['Azriel'],
                  created_at: new Date().toISOString(),
                },
              ],
              error: null,
            }),
          }),
        }),
      }
    }
    if (table === 'audit_log') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    }
    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
  }),
}

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabaseInstance),
  createClient: vi.fn(() => Promise.resolve(mockSupabaseInstance)),
}))

vi.mock('@/lib/auth/authorization', () => ({
  getCurrentUser: vi.fn(),
  requireAdminRole: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Persistent Chat & Media Requirements (Master Plan #43 & Swarm Task)', () => {
  const mockCamper = {
    id: 'camper-101',
    name: 'Yossi Gross',
    application_number: '1042',
    status: 'VAAD Review' as const,
    voting_open: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.getCurrentUser).mockResolvedValue({
      id: 'user-staff-1',
      full_name: 'Azriel Counselor',
      email: 'azriel@oorah.org',
      role: 'staff',
      active: true,
    } as any)
  })

  describe('1. Server Action: sendChatMessage Persistence & Attachments', () => {
    it('persists a standard message into public.chat_messages', async () => {
      const res = await sendChatMessage('camper-101', 'Reviewed the medical files. Everything looks good.')
      expect(res.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          kid_id: 'camper-101',
          author_id: 'user-staff-1',
          content: 'Reviewed the medical files. Everything looks good.',
        })
      )
    })

    it('supports author tagging (@Azriel, @Sarah) and parses tagged_users', async () => {
      const res = await sendChatMessage('camper-101', 'Attention @Azriel and @Sarah: please verify bunk assignment.')
      expect(res.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          kid_id: 'camper-101',
          author_id: 'user-staff-1',
          content: 'Attention @Azriel and @Sarah: please verify bunk assignment.',
          tagged_users: ['Azriel', 'Sarah'],
          metadata: expect.objectContaining({
            tagged_users: ['Azriel', 'Sarah'],
          }),
        })
      )
    })

    it('supports audio voice note attachment (duration, url/proxy)', async () => {
      const audioAttachment = {
        type: 'audio' as const,
        name: 'interview_recording_1.webm',
        url: '/api/media/proxy/vn-drive-777',
        durationSeconds: 42,
      }

      const res = await sendChatMessage(
        'camper-101',
        'Voice interview recording with family',
        audioAttachment
      )

      expect(res.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          kid_id: 'camper-101',
          audio_url: '/api/media/proxy/vn-drive-777',
          attachment_url: '/api/media/proxy/vn-drive-777',
          attachment_type: 'audio',
          attachment_name: 'interview_recording_1.webm',
          duration_seconds: 42,
        })
      )
    })

    it('supports document attachments (pdf, forms)', async () => {
      const docAttachment = {
        type: 'document' as const,
        name: 'Camper_Immunization_Form.pdf',
        url: '/api/media/proxy/doc-drive-888',
      }

      const res = await sendChatMessage('camper-101', 'Attached official doctor signoff', docAttachment)

      expect(res.success).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          kid_id: 'camper-101',
          attachment_url: '/api/media/proxy/doc-drive-888',
          attachment_type: 'document',
          attachment_name: 'Camper_Immunization_Form.pdf',
        })
      )
    })

    it('returns error when caller is unauthenticated', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null)
      const res = await sendChatMessage('camper-101', 'Test message')
      expect(res).toEqual({
        success: false,
        error: 'Unauthorized: Authentication required',
      })
    })

    it('returns error when content and attachment are both empty', async () => {
      const res = await sendChatMessage('camper-101', '   ')
      expect(res.success).toBe(false)
      expect(res.error).toBe('Message content is required')
    })

    it('fetches camper chat messages via getCamperChatMessages', async () => {
      const res = await getCamperChatMessages('camper-101')
      expect(res.success).toBe(true)
      expect(res.messages).toHaveLength(1)
      expect(res.messages[0].content).toBe('Note for @Azriel')
    })
  })

  describe('2. Client Component Chat Tab & Master Plan #43 Empty State', () => {
    it('shows the exact clean empty state from Master Plan #43 when no messages exist', () => {
      render(
        React.createElement(CamperDetailClient, {
          initialCamper: mockCamper,
          initialChatMessages: [],
        })
      )

      // Switch to Chat Tab
      const chatTabTrigger = screen.getByRole('tab', { name: 'Chat' })
      chatTabTrigger.focus()
      fireEvent.keyDown(chatTabTrigger, { key: ' ', code: 'Space' })
      fireEvent.click(chatTabTrigger)

      // Exact text required by Master Plan #43
      expect(
        screen.getByText('No messages yet. Start the conversation below.')
      ).toBeInTheDocument()
    })

    it('renders messages with author tags, audio player with duration, and document attachments', () => {
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          author: 'Rabbi Cohen',
          content: 'Please check with @Azriel regarding dietary requirements.',
          timestamp: '10:15 AM',
          tagged_users: ['Azriel'],
        },
        {
          id: 'msg-2',
          author: 'Sarah Director',
          content: 'Parent intake voice memo',
          timestamp: '10:30 AM',
          attachment: {
            type: 'audio',
            name: 'Parent_Call_Recording.webm',
            url: '/api/media/proxy/voice-memo-101',
            durationSeconds: 45,
          },
        },
        {
          id: 'msg-3',
          author: 'Azriel Counselor',
          content: 'Signed application form attached.',
          timestamp: '11:00 AM',
          attachment: {
            type: 'document',
            name: 'Application_Form_Signed.pdf',
            url: '/api/media/proxy/doc-signed-101',
          },
        },
      ]

      render(
        React.createElement(CamperDetailClient, {
          initialCamper: mockCamper,
          initialChatMessages: mockMessages,
        })
      )

      // Switch to Chat Tab
      const chatTabTrigger = screen.getByRole('tab', { name: 'Chat' })
      chatTabTrigger.focus()
      fireEvent.keyDown(chatTabTrigger, { key: ' ', code: 'Space' })
      fireEvent.click(chatTabTrigger)

      // Verify authors and timestamps
      expect(screen.getByText('Rabbi Cohen')).toBeInTheDocument()
      expect(screen.getByText('10:15 AM')).toBeInTheDocument()
      expect(screen.getByText('Sarah Director')).toBeInTheDocument()
      expect(screen.getByText('Azriel Counselor')).toBeInTheDocument()

      // Verify author tagging badge & highlighted mention
      const azrielElements = screen.getAllByText('@Azriel')
      expect(azrielElements.length).toBeGreaterThanOrEqual(1)

      // Verify audio attachment with duration & download link
      expect(screen.getByText('Parent_Call_Recording.webm')).toBeInTheDocument()
      expect(screen.getByText('(45s)')).toBeInTheDocument()
      expect(screen.getByTestId('chat-audio-attachment')).toBeInTheDocument()
      expect(screen.getByTestId('chat-audio-player')).toBeInTheDocument()

      // Verify document attachment with download link
      expect(screen.getByText('Application_Form_Signed.pdf')).toBeInTheDocument()
      expect(screen.getByTestId('chat-document-attachment')).toBeInTheDocument()
      const downloadLinks = screen.getAllByRole('link', { name: 'Download' })
      expect(downloadLinks.length).toBeGreaterThanOrEqual(2)
      expect(downloadLinks[1]).toHaveAttribute('href', '/api/media/proxy/doc-signed-101')
    })

    it('allows typing a new note and sending it', async () => {
      render(
        React.createElement(CamperDetailClient, {
          initialCamper: mockCamper,
          initialChatMessages: [],
        })
      )

      // Switch to Chat Tab
      const chatTabTrigger = screen.getByRole('tab', { name: 'Chat' })
      chatTabTrigger.focus()
      fireEvent.keyDown(chatTabTrigger, { key: ' ', code: 'Space' })
      fireEvent.click(chatTabTrigger)

      const input = screen.getByPlaceholderText('Type a note (use @name to mention team members)...')
      fireEvent.change(input, { target: { value: 'Followed up with parent @Azriel' } })

      const sendBtn = screen.getByRole('button', { name: 'Send Note' })
      fireEvent.click(sendBtn)

      await waitFor(() => {
        expect(screen.getByText(/Followed up with parent/)).toBeInTheDocument()
        const mentions = screen.getAllByText('@Azriel')
        expect(mentions.length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})
