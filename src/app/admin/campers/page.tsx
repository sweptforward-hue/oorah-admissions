'use client'

import { useState, useEffect, useTransition } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAdminCampers, deleteCamper, updateCamperStatus, toggleCamperVoting } from '@/lib/campers/actions'

interface CamperItem {
  id: string
  name: string
  appNum: string
  status: string
  votingOpen: boolean
}

export default function AdminCampersPage() {
  const [campers, setCampers] = useState<CamperItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const data = await getAdminCampers()
        setCampers(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleManualStatusChange = async (id: string) => {
    const newStatus = prompt('Enter new status (e.g. Accepted, Rejected, Interview):')
    if (!newStatus) return
    const reason = prompt('Enter reason for manual override (required for audit trail):')
    if (!reason) return

    startTransition(async () => {
      try {
        const res = await updateCamperStatus(id, newStatus, reason)
        if (!res.success) {
          alert(res.error || 'Failed to update status')
          return
        }
        setCampers(campers.map(c => c.id === id ? { ...c, status: newStatus } : c))
        alert(`Status updated and audit log entry created: "${reason}"`)
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update status')
      }
    })
  }

  const handleToggleVoting = async (id: string, current: boolean) => {
    const newVoting = !current
    startTransition(async () => {
      try {
        const res = await toggleCamperVoting(id, newVoting)
        if (!res.success) {
          alert(res.error || 'Failed to toggle voting')
          return
        }
        setCampers(campers.map(c => c.id === id ? { ...c, votingOpen: newVoting } : c))
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to toggle voting')
      }
    })
  }

  const handleDeleteCamper = async (id: string, name: string) => {
    const confirmation = prompt(`Type DELETE to confirm permanent deletion of camper record: ${name}`)
    if (confirmation === 'DELETE') {
      startTransition(async () => {
        try {
          const res = await deleteCamper(id)
          if (!res.success) {
            alert(res.error || 'Failed to delete camper. Ensure you have Admin privileges.')
            return
          }
          setCampers(campers.filter(c => c.id !== id))
          alert('Camper deleted and action recorded in audit log.')
        } catch (err: unknown) {
          alert((err as Error).message || 'Failed to delete camper. Ensure you have Admin privileges.')
        }
      })
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Loading camper records...
                </TableCell>
              </TableRow>
            ) : campers.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-semibold text-slate-900">{c.name}</TableCell>
                <TableCell className="text-slate-500">{c.appNum}</TableCell>
                <TableCell><Badge variant="secondary">{c.status}</Badge></TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleToggleVoting(c.id, c.votingOpen)}
                  >
                    {c.votingOpen ? 'Voting Open' : 'Voting Closed'}
                  </Button>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleManualStatusChange(c.id)}>
                    Override Status
                  </Button>
                  <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDeleteCamper(c.id, c.name)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && campers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No camper records found in database.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
