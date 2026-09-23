'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { createBrowserClient } from '@/lib/supabase/client'

interface AuditItem {
  id: string
  action: string
  actor: string
  entityType: string
  entityId: string
  timestamp: string
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAuditLogs() {
      setLoading(true)
      try {
        const supabase = createBrowserClient()
        // Query audit_log from PostgreSQL
        const { data, error } = await supabase
          .from('audit_log')
          .select('id, action, entity_type, entity_id, created_at, actor_id')
          .order('created_at', { ascending: false })
          .limit(50)

        if (!error && data && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: AuditItem[] = data.map((item: any) => ({
            id: item.id,
            action: item.action,
            actor: item.actor_id || 'System / Admin',
            entityType: item.entity_type,
            entityId: item.entity_id || 'N/A',
            timestamp: new Date(item.created_at).toLocaleString(),
          }))
          setLogs(mapped)
        } else {
          setLogs([])
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err)
        setLogs([])
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLogs()
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">System Audit Trail</h1>
      <p className="text-sm text-slate-500 mb-6">
        Complete log of all administrative actions, status overrides, and system automated transitions
      </p>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-3xl block mb-2">📜</span>
            <p className="font-semibold text-slate-700">No audit events recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Administrative status changes, exports, and voting transitions will be audited here in real-time.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Reference ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-slate-500">{l.timestamp}</TableCell>
                  <TableCell className="font-semibold text-slate-900">{l.action}</TableCell>
                  <TableCell className="text-slate-700 font-mono text-xs">{l.actor}</TableCell>
                  <TableCell className="text-slate-500 uppercase text-xs">{l.entityType}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">{l.entityId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
