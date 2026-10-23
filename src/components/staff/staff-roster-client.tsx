'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StaffItem } from '@/types/staff'

export const getRoleVariant = (role: string): 'success' | 'secondary' | 'warning' | 'outline' => {
  switch (role.toLowerCase()) {
    case 'head counselor':
    case 'division head':
    case 'director':
      return 'success'
    case 'counselor':
    case 'senior counselor':
      return 'secondary'
    case 'specialist':
    case 'lifeguard':
      return 'warning'
    default:
      return 'outline'
  }
}

export interface StaffRosterClientProps {
  initialStaff: StaffItem[]
}

export function StaffRosterClient({ initialStaff }: StaffRosterClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSession, setSelectedSession] = useState<string>('All')
  const [selectedRole, setSelectedRole] = useState<string>('All')

  // Filtering
  const filteredStaff = useMemo(() => {
    return initialStaff.filter((member) => {
      // Session filter
      if (selectedSession !== 'All') {
        const matchesSession =
          member.session === selectedSession ||
          member.session === 'All Sessions' ||
          !member.session
        if (!matchesSession) return false
      }

      // Role filter
      if (selectedRole !== 'All') {
        if (member.role_title.toLowerCase() !== selectedRole.toLowerCase()) {
          return false
        }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        const matchName = member.name.toLowerCase().includes(term)
        const matchId = member.application_number.toLowerCase().includes(term)
        const matchEmail = member.email?.toLowerCase().includes(term) || false
        const matchRole = member.role_title.toLowerCase().includes(term)
        const matchDept = member.department.toLowerCase().includes(term)
        const matchBunk = member.bunk_assignment?.toLowerCase().includes(term) || false

        if (!matchName && !matchId && !matchEmail && !matchRole && !matchDept && !matchBunk) {
          return false
        }
      }

      return true
    })
  }, [initialStaff, searchTerm, selectedSession, selectedRole])

  // Summary counts
  const counts = useMemo(() => {
    const total = initialStaff.length
    const active = initialStaff.filter((s) => s.status === 'Active').length
    const sessionA = initialStaff.filter(
      (s) => s.session === 'Session A' || s.session === 'All Sessions'
    ).length
    const sessionB = initialStaff.filter(
      (s) => s.session === 'Session B' || s.session === 'All Sessions'
    ).length
    return { total, active, sessionA, sessionB }
  }, [initialStaff])

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedSession('All')
    setSelectedRole('All')
  }

  const isFiltered = searchTerm !== '' || selectedSession !== 'All' || selectedRole !== 'All'

  return (
    <div className="space-y-6">
      {/* Action and Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Staff Directory & Roster</h1>
          <p className="text-slate-500 mt-1">Manage counselors, division heads, and operational camp staff</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button asChild className="whitespace-nowrap">
            <Link href="/staff/new">+ New Staff Member</Link>
          </Button>
        </div>
      </div>

      {/* Quick Metrics Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Staff</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{counts.total}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Status</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{counts.active}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Session A Cohort</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{counts.sessionA}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Session B Cohort</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">{counts.sessionB}</div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-lg border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            id="staff-roster-search"
            name="roster_search"
            aria-label="Search staff roster"
            placeholder="Search by name, ID, role, or bunk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Session filter tabs */}
          <div className="inline-flex rounded-md shadow-sm border bg-slate-50 p-1 text-xs">
            {['All', 'Session A', 'Session B'].map((session) => (
              <button
                key={session}
                type="button"
                onClick={() => setSelectedSession(session)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedSession === session
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {session === 'All' ? 'All Sessions' : session}
              </button>
            ))}
          </div>

          {/* Role selector dropdown */}
          <select
            aria-label="Filter by staff role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-9 px-3 text-xs rounded-md border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="All">All Roles</option>
            <option value="Counselor">Counselor</option>
            <option value="Senior Counselor">Senior Counselor</option>
            <option value="Division Head">Division Head</option>
            <option value="Head Counselor">Head Counselor</option>
            <option value="Lifeguard">Lifeguard</option>
            <option value="Specialist">Specialist</option>
          </select>

          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs text-slate-500">
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Staff Member</TableHead>
              <TableHead>Staff ID</TableHead>
              <TableHead>Role & Department</TableHead>
              <TableHead>Assigned Session</TableHead>
              <TableHead className="text-right">Bunk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialStaff.length === 0 ? (
              /* Global Empty State */
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                  <div className="text-4xl mb-3">🏕️</div>
                  <div className="text-base font-semibold text-slate-800">No staff members registered yet.</div>
                  <p className="text-xs text-slate-400 mt-1 mb-4 max-w-sm mx-auto">
                    Add your first camp counselor or division head to begin assigning cohorts and bunks.
                  </p>
                  <Button asChild size="sm">
                    <Link href="/staff/new">+ Add Staff Member</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              /* Filtered Search Empty State */
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center text-slate-500">
                  <div className="text-3xl mb-2">🔍</div>
                  <div className="font-semibold text-slate-800">No matching staff members found.</div>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    No staff records match your current search or filter criteria.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Reset Search & Filters
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((member) => (
                <TableRow key={member.id} className="cursor-pointer group hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium text-slate-900">
                    <Link href={`/staff/${member.id}`} className="block group-hover:text-green-700">
                      {member.name}
                    </Link>
                    {member.email && (
                      <span className="text-xs text-slate-400 block mt-0.5">{member.email}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">
                    <Link href={`/staff/${member.id}`} className="block">
                      {member.application_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/staff/${member.id}`} className="flex items-center gap-2">
                      <Badge variant={getRoleVariant(member.role_title)}>
                        {member.role_title}
                      </Badge>
                      <span className="text-xs text-slate-400">{member.department}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    <Link href={`/staff/${member.id}`} className="block text-sm">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          member.session === 'Session A'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : member.session === 'Session B'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {member.session || 'All Sessions'}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-slate-500 font-medium">
                    <Link href={`/staff/${member.id}`} className="block">
                      {member.bunk_assignment ? (
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-800">
                          {member.bunk_assignment}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
