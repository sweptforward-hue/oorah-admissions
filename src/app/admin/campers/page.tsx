'use client'

import { useState, useEffect, useTransition } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { getAdminCampers, deleteCamper, updateCamperStatus, toggleCamperVoting } from '@/lib/campers/actions'

interface CamperItem {
  id: string
  name: string
  appNum: string
  status: string
  votingOpen: boolean
}

const DEFAULT_ADMIN_CAMPERS: CamperItem[] = [
  { id: '1', name: 'John Smith', appNum: '1042', status: 'VAAD Review', votingOpen: true },
  { id: '2', name: 'Sarah Cohen', appNum: '1043', status: 'Accepted', votingOpen: false },
]

export default function AdminCampersPage() {
  const [campers, setCampers] = useState<CamperItem[]>(DEFAULT_ADMIN_CAMPERS)
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<CamperItem | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getAdminCampers()
        if (Array.isArray(data)) {
          setCampers(data)
        }
      } catch (e) {
        console.error(e)
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
        setCampers(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
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
        setCampers(prev => prev.map(c => c.id === id ? { ...c, votingOpen: newVoting } : c))
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to toggle voting')
      }
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)

    startTransition(async () => {
      try {
        const res = await deleteCamper(target.id)
        if (!res.success) {
          setFeedback(`Error: ${res.error || 'Failed to delete camper. Ensure you have Admin privileges.'}`)
          return
        }
        setCampers(prev => prev.filter(c => c.id !== target.id))
        setFeedback(`Camper "${target.name}" deleted and action recorded in audit log.`)
      } catch (err: unknown) {
        setFeedback(`Error: ${(err as Error).message || 'Failed to delete camper.'}`)
      }
    })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Camper Controls</h1>
          <p className="text-sm text-slate-500">Manual status overrides, VAAD voting locks, and deletion</p>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-md border text-sm flex justify-between items-center ${feedback.startsWith('Error:') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          <span>{feedback}</span>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)}>Dismiss</Button>
        </div>
      )}

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
            {campers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  No campers found.
                </TableCell>
              </TableRow>
            ) : (
              campers.map((c) => (
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
                    <Button size="sm" variant="destructive" disabled={isPending} onClick={() => setDeleteTarget(c)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Camper Record"
        message={deleteTarget ? `Are you sure you want to permanently delete camper record "${deleteTarget.name}" (App #${deleteTarget.appNum})? This will cascade-delete all child records (photos, notes, votes, documents, media) and record an entry in the audit log.` : ''}
        confirmText="Delete Camper"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
