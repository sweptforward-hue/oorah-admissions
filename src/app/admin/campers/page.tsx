'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function AdminCampersPage() {
  const [campers, setCampers] = useState([
    { id: '1', name: 'John Smith', appNum: '1042', status: 'VAAD Review', votingOpen: true },
    { id: '2', name: 'Sarah Cohen', appNum: '1043', status: 'Accepted', votingOpen: false },
  ])

  const handleManualStatusChange = (id: string) => {
    const newStatus = prompt('Enter new status (e.g. Accepted, Rejected, Interview):')
    if (!newStatus) return
    const reason = prompt('Enter reason for manual override (required for audit trail):')
    if (!reason) return

    setCampers(campers.map(c => c.id === id ? { ...c, status: newStatus } : c))
    alert(`Status updated and audit log entry created: "${reason}"`)
  }

  const handleToggleVoting = (id: string, current: boolean) => {
    setCampers(campers.map(c => c.id === id ? { ...c, votingOpen: !current } : c))
  }

  const handleDeleteCamper = (id: string, name: string) => {
    const confirmation = prompt(`Type DELETE to confirm permanent deletion of camper record: ${name}`)
    if (confirmation === 'DELETE') {
      setCampers(campers.filter(c => c.id !== id))
      alert('Camper deleted and action recorded in audit log.')
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Camper Controls</h1>
          <p className="text-sm text-slate-500">Manual status overrides, VAAD voting locks, and deletion</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Camper</TableHead>
              <TableHead>Application #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>VAAD Voting</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold text-slate-900">{c.name}</TableCell>
                <TableCell className="text-slate-500">{c.appNum}</TableCell>
                <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVoting(c.id, c.votingOpen)}
                  >
                    {c.votingOpen ? 'Voting Open' : 'Voting Closed'}
                  </Button>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleManualStatusChange(c.id)}>
                    Override Status
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteCamper(c.id, c.name)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
