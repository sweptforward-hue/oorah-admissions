import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getStaffRoster } from '@/lib/staff/actions'
import { getRoleVariant } from '@/components/staff/staff-roster-client'

export const dynamic = 'force-dynamic'

export default async function SessionBStaffPage() {
  const staff = await getStaffRoster({ session: 'Session B' })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Session B Staff Roster</h1>
          <p className="text-sm text-slate-500">Operational counselors and division heads assigned to Session B</p>
        </div>
        <Button asChild size="sm">
          <Link href="/staff/new">+ Assign Staff</Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {staff.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-3xl block mb-2">🏕️</span>
            <p className="font-semibold text-slate-700">No staff assigned to Session B</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Add operational camp staff or assign existing counselors to Session B.
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
                <TableHead>ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Bunk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id} className="hover:bg-slate-50">
                  <TableCell className="font-semibold text-slate-900">
                    <Link href={`/staff/${s.id}`} className="hover:text-green-700">
                      {s.name}
                    </Link>
                    {s.email && <span className="block text-xs text-slate-400 font-normal">{s.email}</span>}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500">{s.application_number}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleVariant(s.role_title)}>
                      {s.role_title}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {s.bunk_assignment || <span className="text-xs text-slate-400 italic">Unassigned</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'Active' ? 'success' : 'secondary'}>
                      {s.status}
                    </Badge>
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
