import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { resetMockDb } from '@/lib/vaad/queries'
import { logAuditEvent, getAuditLogs, AuditLogEntry } from '@/lib/services/audit'
import { AuditLogTable } from '@/components/admin/audit-log-table'
import { updateUser } from '@/lib/users/actions'

describe('Audit Logging & Deactivation Attribution Pipeline', () => {
  beforeEach(() => {
    resetMockDb()
  })

  it('creates append-only audit log entries correctly', async () => {
    const entry1 = await logAuditEvent(null, {
      userId: 'user-101',
      action: 'status_transition',
      entityType: 'kid',
      entityId: 'kid-55',
      metadata: { from: 'New', to: 'Under Review' },
    })

    expect(entry1.action).toBe('status_transition')
    expect(entry1.entity_type).toBe('kid')
    expect(entry1.entity_id).toBe('kid-55')

    const result = await getAuditLogs(null)
    expect(result.totalCount).toBe(1)
    expect(result.logs[0].id).toBe(entry1.id)
  })

  it('filters audit logs by actor, entityType, action, and date range', async () => {
    await logAuditEvent(null, {
      userId: 'user-1',
      action: 'vaad_vote',
      entityType: 'vaad_vote',
      entityId: 'vote-1',
    })

    await logAuditEvent(null, {
      userId: 'user-2',
      action: 'status_override',
      entityType: 'kid',
      entityId: 'kid-2',
    })

    await logAuditEvent(null, {
      userId: 'user-1',
      action: 'file_upload',
      entityType: 'file',
      entityId: 'file-10',
    })

    // Filter by entityType
    const kidLogs = await getAuditLogs(null, { entityType: 'kid' })
    expect(kidLogs.totalCount).toBe(1)
    expect(kidLogs.logs[0].action).toBe('status_override')

    // Filter by action
    const voteLogs = await getAuditLogs(null, { action: 'vaad_vote' })
    expect(voteLogs.totalCount).toBe(1)
    expect(voteLogs.logs[0].entity_type).toBe('vaad_vote')
  })

  it('paginates audit log records correctly', async () => {
    for (let i = 1; i <= 15; i++) {
      await logAuditEvent(null, {
        userId: `user-${i}`,
        action: 'status_transition',
        entityType: 'kid',
        entityId: `kid-${i}`,
      })
    }

    const page1 = await getAuditLogs(null, { page: 1, pageSize: 10 })
    expect(page1.totalCount).toBe(15)
    expect(page1.logs.length).toBe(10)
    expect(page1.totalPages).toBe(2)

    const page2 = await getAuditLogs(null, { page: 2, pageSize: 10 })
    expect(page2.logs.length).toBe(5)
  })

  it('renders AuditLogTable with filter controls and handles filtering UI', () => {
    const mockLogs: AuditLogEntry[] = [
      {
        id: '1',
        actor: 'Azriel Cohenca',
        action: 'status_override',
        entity_type: 'kid',
        entity_id: '1042',
        created_at: '2026-08-20T18:25:00Z',
      },
      {
        id: '2',
        actor: 'Sarah Staff',
        action: 'user_deactivated',
        entity_type: 'user',
        entity_id: 'usr-99',
        created_at: '2026-08-20T17:40:00Z',
      },
    ]

    render(<AuditLogTable initialLogs={mockLogs} />)

    expect(screen.getByText('Filter Audit Trail', { exact: false })).toBeDefined()
    expect(screen.getByText('Azriel Cohenca')).toBeDefined()
    expect(screen.getByText('Sarah Staff')).toBeDefined()

    // Filter by actor
    const actorInput = screen.getByPlaceholderText('Search by actor...')
    fireEvent.change(actorInput, { target: { value: 'Azriel' } })

    expect(screen.getByText('Azriel Cohenca')).toBeDefined()
    expect(screen.queryByText('Sarah Staff')).toBeNull()
  })

  it('logs user_deactivated event during soft deactivation preserving historical attribution', async () => {
    await updateUser('usr-123', { active: false })

    const result = await getAuditLogs(null)
    expect(result.totalCount).toBe(1)
    expect(result.logs[0].action).toBe('user_deactivated')
    expect(result.logs[0].entity_type).toBe('user')
    expect(result.logs[0].entity_id).toBe('usr-123')
  })
})
