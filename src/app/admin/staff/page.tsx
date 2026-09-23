import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface StaffMember {
  id: string
  name: string
  role: string
  email: string
  session: string
}

export default async function AdminStaffPage() {
  let staffMembers: StaffMember[] = []

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('users')
      .select('id, name, email, role')
      .in('role', ['staff', 'admin'])
      .order('name')

    if (data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      staffMembers = data.map((u: any) => ({
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'Staff Member',
        role: u.role === 'admin' ? 'Administrator' : 'Staff Counselor',
        email: u.email || 'N/A',
        session: 'All Sessions',
      }))
    }
  } catch (err) {
    console.error('Failed to query staff users:', err)
  }

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
        {staffMembers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-3xl block mb-2">👥</span>
            <p className="font-semibold text-slate-700">No staff members found</p>
            <p className="text-xs text-slate-400 mt-1">
              Staff members registered via Google Auth will appear here automatically.
            </p>
          </div>
        ) : (
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
                  <TableCell className="text-slate-600 capitalize">{s.role}</TableCell>
                  <TableCell className="text-slate-500">{s.email}</TableCell>
                  <TableCell className="text-slate-700">{s.session}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
