'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface Status {
  id: string
  name: string
  description: string | null
  display_order: number
  active: boolean
  is_default: boolean
  color_hex: string | null
}

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newStatusName, setNewStatusName] = useState('')

  // Toggle active dialog state
  const [toggleTarget, setToggleTarget] = useState<{ id: string; active: boolean } | null>(null)

  useEffect(() => {
    fetchStatuses()
  }, [])

  async function fetchStatuses() {
    setLoading(true)
    const { data } = await supabase
      .from('statuses')
      .select('*')
      .order('display_order', { ascending: true })

    if (data) {
      setStatuses(data)
    }
    setLoading(false)
  }

  async function handleConfirmToggleActive() {
    if (!toggleTarget) return
    const { id, active } = toggleTarget

    const { error } = await supabase
      .from('statuses')
      .update({ active: !active })
      .eq('id', id)

    if (!error) {
      fetchStatuses()
    }
    setToggleTarget(null)
  }

  async function addStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!newStatusName.trim()) return

    const maxOrder = statuses.reduce((max, s) => Math.max(max, s.display_order), 0)

    const { error } = await supabase
      .from('statuses')
      .insert({
        name: newStatusName.trim(),
        display_order: maxOrder + 10,
        active: true,
        is_default: false
      })

    if (!error) {
      setNewStatusName('')
      setIsAdding(false)
      fetchStatuses()
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Application Statuses</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded"
        >
          {isAdding ? 'Cancel' : '+ Add Status'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={addStatus} className="mb-6 p-4 border rounded bg-gray-50">
          <div className="flex gap-4">
            <input
              type="text"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              placeholder="Status Name (e.g. Waitlisted)"
              className="flex-1 p-2 border rounded"
              autoFocus
            />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
              Save
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {statuses.map(status => (
          <div key={status.id} className={`p-4 border rounded flex justify-between items-center ${!status.active ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                {status.name}
                {status.is_default && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Default</span>
                )}
              </h3>
              <p className="text-sm text-gray-500">
                Order: {status.display_order}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`px-2 py-1 text-xs rounded ${status.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                {status.active ? 'Active' : 'Inactive'}
              </span>
              {!status.is_default && (
                <button
                  onClick={() => setToggleTarget({ id: status.id, active: status.active })}
                  className="text-sm border px-3 py-1 rounded hover:bg-gray-50"
                >
                  {status.active ? 'Deactivate' : 'Reactivate'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleConfirmToggleActive}
        title={toggleTarget?.active ? 'Confirm Deactivation' : 'Confirm Reactivation'}
        message={
          toggleTarget?.active
            ? 'Are you sure you want to deactivate this status?'
            : 'Are you sure you want to reactivate this status?'
        }
        confirmText={toggleTarget?.active ? 'Deactivate' : 'Reactivate'}
        variant={toggleTarget?.active ? 'destructive' : 'default'}
      />
    </div>
  )
}
