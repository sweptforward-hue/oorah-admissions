'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAuditLogs } from '@/lib/admin/actions'

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
    async function loadLogs() {
      setLoading(true)
      try {
        const data = await getAuditLogs()
        setLogs(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">System Audit Trail</h1>
      <p className="text-sm text-slate-500 mb-6">Complete log of all administrative actions, status overrides, and system automated transitions</p>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Loading audit logs...
                </TableCell>
              </TableRow>
            ) : logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs text-slate-500">{l.timestamp}</TableCell>
                <TableCell className="font-semibold text-slate-900">{l.action}</TableCell>
                <TableCell className="text-slate-700">{l.actor}</TableCell>
                <TableCell className="text-slate-500 uppercase text-xs">{l.entityType}</TableCell>
                <TableCell className="text-slate-500 font-mono text-xs">{l.entityId}</TableCell>
              </TableRow>
            ))}
            {!loading && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No audit log records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
