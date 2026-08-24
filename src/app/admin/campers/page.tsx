'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'

export default function AdminCampersPage() {
  const [campers, setCampers] = useState([
    { id: '1', name: 'John Smith', appNum: '1042', status: 'VAAD Review', votingOpen: true },
    { id: '2', name: 'Sarah Cohen', appNum: '1043', status: 'Accepted', votingOpen: false },
  ])

  // Override status modal state
  const [overrideTarget, setOverrideTarget] = useState<{ id: string; name: string } | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [overrideReason, setOverrideReason] = useState('')

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteInput, setDeleteInput] = useState('')

  // Notification state
  const [notification, setNotification] = useState<string | null>(null)

  const handleOpenOverride = (camper: { id: string; name: string }) => {
    setOverrideTarget(camper)
    setNewStatus('')
    setOverrideReason('')
  }

  const handleConfirmOverride = () => {
    if (!overrideTarget || !newStatus || !overrideReason) return
    setCampers(campers.map(c => c.id === overrideTarget.id ? { ...c, status: newStatus } : c))
    setNotification(`Status updated and audit log entry created: "${overrideReason}"`)
    setOverrideTarget(null)
  }

  const handleOpenDelete = (camper: { id: string; name: string }) => {
    setDeleteTarget(camper)
    setDeleteInput('')
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget || deleteInput !== 'DELETE') return
    setCampers(campers.filter(c => c.id !== deleteTarget.id))
    setNotification('Camper deleted and action recorded in audit log.')
    setDeleteTarget(null)
  }

  const handleToggleVoting = (id: string, current: boolean) => {
    setCampers(campers.map(c => c.id === id ? { ...c, votingOpen: !current } : c))
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Camper Controls</h1>
          <p className="text-sm text-slate-500">Manual status overrides, VAAD voting locks, and deletion</p>
        </div>
      </div>

      {notification && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-md flex justify-between items-center">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-green-600 hover:text-green-800 font-bold">
            ✕
          </button>
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
                  <Button size="sm" variant="outline" onClick={() => handleOpenOverride(c)}>
                    Override Status
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleOpenDelete(c)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Override Status Modal */}
      <Modal
        isOpen={Boolean(overrideTarget)}
        onClose={() => setOverrideTarget(null)}
        title={`Override Status - ${overrideTarget?.name}`}
        description="Enter the new status and required reason for audit logging."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
            <input
              type="text"
              placeholder="e.g. Accepted, Rejected, Interview"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason (Required for audit log)</label>
            <input
              type="text"
              placeholder="Enter reason for manual override"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-full p-2 border rounded-md text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOverrideTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={!newStatus || !overrideReason}
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmOverride}
            >
              Confirm Override
            </Button>
          </div>
        </div>
      </Modal>

      {/* Single Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Confirm Permanent Deletion - ${deleteTarget?.name}`}
        description={`Type DELETE below to confirm permanent deletion of camper record: ${deleteTarget?.name}`}
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Type DELETE to confirm"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteInput !== 'DELETE'}
              onClick={handleConfirmDelete}
            >
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
