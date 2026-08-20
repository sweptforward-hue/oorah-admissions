import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function SessionBStaffPage() {
  const staff = [
    { id: '3', name: 'Sarah Levy', role: 'Head Counselor', email: 'slevy@oorah.org', status: 'Active' },
    { id: '4', name: 'Chana Friedman', role: 'Activity Director', email: 'cfriedman@oorah.org', status: 'Active' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Session B Staff Roster</h1>
      <p className="text-sm text-slate-500 mb-6">Assigned counselors and supervisors for Session B</p>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold text-slate-900">{s.name}</TableCell>
                <TableCell className="text-slate-600">{s.role}</TableCell>
                <TableCell className="text-slate-500">{s.email}</TableCell>
                <TableCell><Badge variant="success">{s.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
