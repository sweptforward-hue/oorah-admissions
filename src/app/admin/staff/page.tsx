import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export default function AdminStaffPage() {
  const staffMembers = [
    { id: '1', name: 'Rabbi Michael Klein', role: 'Head Counselor', email: 'michael@oorah.org', session: 'Session A' },
    { id: '2', name: 'David Stern', role: 'Counselor', email: 'dstern@oorah.org', session: 'Session A' },
    { id: '3', name: 'Sarah Levy', role: 'Head Counselor', email: 'slevy@oorah.org', session: 'Session B' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Staff Management</h1>
          <p className="text-sm text-slate-500">Assign staff to cohorts and review coverage</p>
        </div>
        <Button asChild>
          <Link href="/admin/users">Manage User Roles & VAAD</Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Assigned Session</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold text-slate-900">{s.name}</TableCell>
                <TableCell className="text-slate-600">{s.role}</TableCell>
                <TableCell className="text-slate-500">{s.email}</TableCell>
                <TableCell className="text-slate-700">{s.session}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
