'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

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
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newStatusName, setNewStatusName] = useState('')

  const fetchStatuses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('statuses')
        .select('*')
        .order('display_order', { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
        setStatuses([])
      } else {
        setStatuses(data || [])
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load statuses')
      setStatuses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  async function toggleActive(id: string, currentStatus: boolean) {
    const action = currentStatus ? 'deactivate' : 'reactivate'
    if (!window.confirm(`Are you sure you want to ${action} this status?`)) return

    try {
      const { error: updateError } = await supabase
        .from('statuses')
        .update({ active: !currentStatus })
        .eq('id', id)

      if (updateError) {
        alert(`Failed to update status: ${updateError.message}`)
        return
      }
      setStatuses(prev => prev.map(s => s.id === id ? { ...s, active: !currentStatus } : s))
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to update status')
    }
  }

  async function addStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!newStatusName.trim()) return

    const maxOrder = statuses.reduce((max, s) => Math.max(max, s.display_order), 0)
    const nextOrder = maxOrder + 10

    try {
      const { data, error: insertError } = await supabase
        .from('statuses')
        .insert({
          name: newStatusName.trim(),
          display_order: nextOrder,
          active: true,
          is_default: false
        })
        .select()
        .single()

      if (insertError) {
        alert(`Failed to add status: ${insertError.message}`)
        return
      }

      if (data) {
        setStatuses(prev => [...prev, data])
      } else {
        await fetchStatuses()
      }
      setNewStatusName('')
      setIsAdding(false)
    } catch (err: unknown) {
      alert((err as Error).message || 'Failed to add status')
    }
  }

  if (loading) return <div className="p-8 text-slate-600">Loading application statuses...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Application Statuses</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors"
        >
          {isAdding ? 'Cancel' : '+ Add Status'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          Failed to load status configuration from database: {error}
        </div>
      )}

      {isAdding && (
        <form onSubmit={addStatus} className="mb-6 p-4 border rounded bg-slate-50 border-slate-200">
          <div className="flex gap-4">
            <input
              type="text"
              id="status-name-input"
              name="status_name"
              aria-label="Status Name"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              placeholder="Status Name (e.g. Waitlisted)"
              className="flex-1 p-2 border rounded bg-white text-sm"
              autoFocus
            />
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors">
              Save
            </button>
          </div>
        </form>
      )}

      {statuses.length === 0 ? (
        <div className="p-8 text-center text-slate-500 border border-dashed rounded bg-slate-50 text-sm">
          No application statuses found in schema.
        </div>
      ) : (
        <div className="space-y-4">
          {statuses.map(status => (
            <div key={status.id} className={`p-4 border rounded flex justify-between items-center ${!status.active ? 'opacity-60 bg-slate-50' : 'bg-white'}`}>
              <div>
                <h3 className="font-semibold flex items-center gap-2 text-slate-900">
                  {status.name}
                  {status.is_default && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-normal">Default</span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order: {status.display_order} {status.description ? `• ${status.description}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-xs rounded font-medium ${status.active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'}`}>
                  {status.active ? 'Active' : 'Inactive'}
                </span>
                {!status.is_default && (
                  <button
                    onClick={() => toggleActive(status.id, status.active)}
                    className="text-xs border px-3 py-1.5 rounded hover:bg-slate-50 transition-colors text-slate-700"
                  >
                    {status.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
