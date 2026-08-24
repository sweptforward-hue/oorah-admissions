'use client'

import { useState, useMemo } from 'react'
import { AuditLogEntry } from '@/lib/services/audit'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AuditLogTableProps {
  initialLogs?: AuditLogEntry[]
}

const ENTITY_TYPES = [
  { value: 'all', label: 'All Entity Types' },
  { value: 'kid', label: 'Kid / Camper' },
  { value: 'user', label: 'User / Staff' },
  { value: 'vaad_member', label: 'VAAD Member' },
  { value: 'vaad_vote', label: 'VAAD Vote' },
  { value: 'status', label: 'Status' },
  { value: 'session', label: 'Session' },
  { value: 'export', label: 'Export' },
  { value: 'file', label: 'File Upload' },
]

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'status_transition', label: 'Status Transition' },
  { value: 'status_override', label: 'Status Override' },
  { value: 'automatic_acceptance', label: 'Automatic Acceptance' },
  { value: 'vaad_vote', label: 'VAAD Vote' },
  { value: 'file_upload', label: 'File Upload' },
  { value: 'role_modified', label: 'Role Modified' },
  { value: 'user_activated', label: 'User Activated' },
  { value: 'user_deactivated', label: 'User Deactivated' },
  { value: 'vaad_permissions_modified', label: 'VAAD Permissions Modified' },
  { value: 'export_data', label: 'Export Data' },
  { value: 'session_config', label: 'Session Configuration' },
]

export function AuditLogTable({ initialLogs = [] }: AuditLogTableProps) {
  const [actorFilter, setActorFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Filter logs locally if provided
  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      // Actor filter
      if (actorFilter.trim() !== '') {
        const actorName = (log.actor || log.user?.name || log.user?.email || log.user_id || '').toLowerCase()
        if (!actorName.includes(actorFilter.toLowerCase().trim())) {
          return false
        }
      }

      // Entity type filter
      if (entityTypeFilter !== 'all' && log.entity_type !== entityTypeFilter) {
        return false
      }

      // Action filter
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false
      }

      // Date range filters
      if (startDateFilter) {
        const startTime = new Date(startDateFilter).getTime()
        const logTime = new Date(log.created_at).getTime()
        if (logTime < startTime) return false
      }

      if (endDateFilter) {
        const end = new Date(endDateFilter)
        end.setHours(23, 59, 59, 999)
        const endTime = end.getTime()
        const logTime = new Date(log.created_at).getTime()
        if (logTime > endTime) return false
      }

      return true
    })
  }, [initialLogs, actorFilter, entityTypeFilter, actionFilter, startDateFilter, endDateFilter])

  const totalCount = filteredLogs.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredLogs.slice(startIndex, startIndex + pageSize)
  }, [filteredLogs, currentPage, pageSize])

  const handleResetFilters = () => {
    setActorFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setEntityTypeFilter('all')
    setActionFilter('all')
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Filter Audit Trail</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Actor Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Actor</label>
            <Input
              type="text"
              placeholder="Search by actor..."
              value={actorFilter}
              onChange={(e) => {
                setActorFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs"
            />
          </div>

          {/* Date Range - Start */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs"
            />
          </div>

          {/* Date Range - End */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="text-xs"
            />
          </div>

          {/* Entity Type Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => {
                setEntityTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {ACTION_TYPES.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-xs text-slate-500">
            Showing {filteredLogs.length} of {initialLogs.length} entries
          </span>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>Reference ID</TableHead>
              <TableHead>Metadata / Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="font-semibold text-slate-900 text-xs">{l.action}</TableCell>
                <TableCell className="text-slate-700 text-xs">
                  {l.actor || (l.user ? (l.user.name || l.user.email) : 'System')}
                </TableCell>
                <TableCell className="text-slate-500 uppercase text-xs">{l.entity_type}</TableCell>
                <TableCell className="text-slate-500 font-mono text-xs">{l.entity_id || '—'}</TableCell>
                <TableCell className="text-slate-500 text-xs max-w-xs truncate">
                  {l.metadata ? JSON.stringify(l.metadata) : '—'}
                </TableCell>
              </TableRow>
            ))}
            {paginatedLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-slate-500">
                  No matching audit records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-600">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="h-8 rounded border border-slate-300 bg-white px-2 text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="text-xs h-8 px-2"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="text-xs h-8 px-2"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
