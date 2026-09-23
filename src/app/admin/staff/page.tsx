import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function AdminStaffPage() {
  const supabase = await createClient()

  const { data: usersData, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, active')
    .order('full_name', { ascending: true })

  const staffMembers = (usersData || []).map((u) => ({
    id: u.id,
    name: u.full_name || 'Unnamed Staff',
    role: u.role ? u.role.toUpperCase() : 'STAFF',
    email: u.email,
    active: u.active ?? true,
  }))

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

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          Failed to load staff list: {error.message}
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold text-slate-900">{s.name}</TableCell>
                <TableCell className="text-slate-600">{s.role}</TableCell>
                <TableCell className="text-slate-500">{s.email}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      s.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {staffMembers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-sm">
                  No staff members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
