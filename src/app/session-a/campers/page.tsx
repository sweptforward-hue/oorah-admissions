import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface CamperItem {
  id: string
  name: string
  appNum: string
  status: string
  bunk: string
  activity: string
}

export default async function SessionACampersPage() {
  let campers: CamperItem[] = []

  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('kids')
      .select('id, name, first_name, last_name, application_number, created_at, session, statuses(name)')
      .or('session.eq.Session A,session.is.null')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      campers = data.map((c: any) => {
        const rawStatus = c.statuses
        const statusName = Array.isArray(rawStatus) ? rawStatus[0]?.name : rawStatus?.name
        const fullName = c.name || (c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : 'Camper')
        return {
          id: c.id,
          name: fullName,
          appNum: c.application_number || 'N/A',
          status: statusName || 'New',
          bunk: 'Unassigned',
          activity: new Date(c.created_at).toLocaleDateString(),
        }
      })
    }
  } catch (err) {
    console.error('Failed to query session A campers:', err)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Session A Campers</h1>
          <p className="text-sm text-slate-500">Campers enrolled in Session A</p>
        </div>
        <Button asChild>
          <Link href="/campers/new">+ Register Camper</Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {campers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <span className="text-3xl block mb-2">🏕️</span>
            <p className="font-semibold text-slate-700">No campers enrolled in Session A yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Registered campers assigned to Session A will appear here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Camper Name</TableHead>
                <TableHead>Application #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bunk</TableHead>
                <TableHead className="text-right">Enrolled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold text-slate-900">
                    <Link href={`/campers/${c.id}`} className="hover:underline text-green-700">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-500">{c.appNum}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'Accepted' ? 'success' : 'secondary'}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">{c.bunk}</TableCell>
                  <TableCell className="text-right text-slate-500">{c.activity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
