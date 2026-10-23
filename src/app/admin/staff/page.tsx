import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getStaffRoster } from '@/lib/staff/actions'
import { getRoleVariant } from '@/components/staff/staff-roster-client'

export const dynamic = 'force-dynamic'

export default async function AdminStaffPage() {
  const staffMembers = await getStaffRoster()

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Staff Operations</h1>
          <p className="text-sm text-slate-500">
            Operational camp counselors, division heads, and bunk assignments (distinct from system users)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/users">Manage System Users & Roles &rarr;</Link>
          </Button>
          <Button asChild>
            <Link href="/staff/new">+ Add Staff Member</Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {staffMembers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-3xl block mb-2">🏕️</span>
            <p className="font-semibold text-slate-700">No operational staff records found</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add your first counselor or division head to begin assigning cohorts.
            </p>
            <Button asChild size="sm">
              <Link href="/staff/new">+ Add Staff Member</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Role & Department</TableHead>
                <TableHead>Assigned Session</TableHead>
                <TableHead>Bunk</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50">
                  <TableCell className="font-semibold text-slate-900">
                    <Link href={`/staff/${s.id}`} className="hover:text-green-700">
                      {s.name}
                    </Link>
                    {s.email && <span className="block text-xs text-slate-400 font-normal">{s.email}</span>}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{s.application_number}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleVariant(s.role_title)}>
                      {s.role_title}
                    </Badge>
                    <span className="text-xs text-slate-400 ml-2">{s.department}</span>
                  </TableCell>
                  <TableCell className="text-slate-700 text-sm">{s.session || 'All Sessions'}</TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {s.bunk_assignment || <span className="text-xs text-slate-400 italic">Unassigned</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/staff/${s.id}`}>Manage</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
