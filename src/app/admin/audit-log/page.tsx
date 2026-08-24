'use client'

import { useState, useEffect } from 'react'
import { AuditLogTable } from '@/components/admin/audit-log-table'
import { AuditLogEntry, getAuditLogs } from '@/lib/services/audit'
import { createBrowserClient } from '@/lib/supabase/client'

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([
    {
      id: '1',
      action: 'status_override',
      actor: 'Azriel Cohenca',
      entity_type: 'kid',
      entity_id: '1042',
      created_at: '2026-08-20T18:25:00Z',
      metadata: { reason: 'Admin manual override' },
    },
    {
      id: '2',
      action: 'export_data',
      actor: 'Azriel Cohenca',
      entity_type: 'export',
      entity_id: 'sheets-sync',
      created_at: '2026-08-20T17:40:00Z',
      metadata: { destination: 'Google Sheets' },
    },
    {
      id: '3',
      action: 'automatic_acceptance',
      actor: 'System (VAAD)',
      entity_type: 'kid',
      entity_id: '1043',
      created_at: '2026-08-20T16:10:00Z',
      metadata: { trigger: '2/3 Accept votes threshold' },
    },
  ])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const client = createBrowserClient()
    getAuditLogs(client)
      .then((res) => {
        if (res.logs && res.logs.length > 0) {
          setLogs(res.logs)
        }
      })
      .catch((err) => console.error('Error loading audit logs:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">System Audit Trail</h1>
        <p className="text-sm text-slate-500">
          Complete append-only log of all administrative actions, status overrides, VAAD voting events, user deactivations, and system automated transitions.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading audit trail...</div>
      ) : (
        <AuditLogTable initialLogs={logs} />
      )}
    </div>
  )
}
