import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface StaffMember {
  id: string
  name: string
  role: string
  email: string
  status: string
}

export default async function SessionAStaffPage() {
  let staff: StaffMember[] = []

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('users')
      .select('id, full_name, name, email, role, active')
      .in('role', ['staff', 'admin'])
      .order('full_name')

    if (data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      staff = data.map((u: any) => ({
        id: u.id,
        name: u.full_name || u.name || u.email?.split('@')[0] || 'Staff Member',
        role: u.role === 'admin' ? 'Head Administrator' : 'Session A Counselor',
        email: u.email || 'N/A',
        status: u.active !== false ? 'Active' : 'Inactive',
      }))
    }
  } catch (err) {
    console.error('Failed to load Session A staff:', err)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Session A Staff Roster</h1>
      <p className="text-sm text-slate-500 mb-6">Assigned counselors and supervisors for Session A</p>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {staff.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-3xl block mb-2">👥</span>
            <p className="font-semibold text-slate-700">No staff members registered</p>
            <p className="text-xs text-slate-400 mt-1">
              Active staff members and administrators will appear in this roster once authenticated.
            </p>
          </div>
        ) : (
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
