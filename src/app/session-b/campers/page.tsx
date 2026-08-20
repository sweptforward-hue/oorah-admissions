import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function SessionBCampersPage() {
  const sessionBCampers = [
    { id: '2', name: 'Sarah Cohen', appNum: '1043', status: 'Accepted', bunk: 'Bunk 7', activity: 'Yesterday' },
    { id: '4', name: 'Rachel Katz', appNum: '1050', status: 'New', bunk: 'Unassigned', activity: 'Today' },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Session B Campers</h1>
          <p className="text-sm text-slate-500">Campers enrolled in Session B</p>
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
            {sessionBCampers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold text-slate-900">
                  <Link href={`/campers/${c.id}`} className="hover:underline">{c.name}</Link>
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
      </div>
    </div>
  )
}
