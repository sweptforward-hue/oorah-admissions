'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface AuditItem {
  id: string
  action: string
  actor: string
  entityType: string
  entityId: string
  timestamp: string
}

export default function AdminAuditLogPage() {
  const [logs] = useState<AuditItem[]>([
    { id: '1', action: 'status_override', actor: 'Azriel Cohenca', entityType: 'kid', entityId: '1042', timestamp: '2026-08-20 18:25' },
    { id: '2', action: 'export_data', actor: 'Azriel Cohenca', entityType: 'export', entityId: 'sheets-sync', timestamp: '2026-08-20 17:40' },
    { id: '3', action: 'automatic_acceptance', actor: 'System (VAAD)', entityType: 'kid', entityId: '1043', timestamp: '2026-08-20 16:10' },
  ])

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
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs text-slate-500">{l.timestamp}</TableCell>
                <TableCell className="font-semibold text-slate-900">{l.action}</TableCell>
                <TableCell className="text-slate-700">{l.actor}</TableCell>
                <TableCell className="text-slate-500 uppercase text-xs">{l.entityType}</TableCell>
                <TableCell className="text-slate-500 font-mono text-xs">{l.entityId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
