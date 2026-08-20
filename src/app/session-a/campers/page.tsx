import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function SessionACampersPage() {
  const sessionACampers = [
    { id: '1', name: 'John Smith', appNum: '1042', status: 'Accepted', bunk: 'Bunk 3', activity: 'Today' },
    { id: '3', name: 'David Levy', appNum: '1044', status: 'VAAD Review', bunk: 'Unassigned', activity: 'Yesterday' },
  ]

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Camper Name</TableHead>
              <TableHead>Application #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bunk</TableHead>
              <TableHead className="text-right">Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionACampers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold text-slate-900">
                  <Link href={`/campers/${c.id}`} className="hover:underline">{c.name}</Link>
                </TableCell>
                <TableCell className="text-slate-500">{c.appNum}</TableCell>
                <TableCell>
                  <Badge variant={c.status === 'Accepted' ? 'success' : 'warning'}>{c.status}</Badge>
                </TableCell>
                <TableCell className="text-slate-600">{c.bunk}</TableCell>
                <TableCell className="text-right text-slate-500">{c.activity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
