'use client'

import { useEffect, useState } from 'react'
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
  const [isAdding, setIsAdding] = useState(false)
  const [newStatusName, setNewStatusName] = useState('')
  const fallbackStatuses: Status[] = [
    { id: '1', name: 'New', description: 'Application initiated', display_order: 10, active: true, is_default: true, color_hex: '#64748b' },
    { id: '2', name: 'Under Review', description: 'Staff reviewing documents', display_order: 20, active: true, is_default: false, color_hex: '#3b82f6' },
    { id: '3', name: 'Interview', description: 'Interview scheduled or prep', display_order: 30, active: true, is_default: false, color_hex: '#8b5cf6' },
    { id: '4', name: 'VAAD Review', description: 'In committee voting', display_order: 40, active: true, is_default: false, color_hex: '#f59e0b' },
    { id: '5', name: 'Accepted', description: 'Admitted to camp', display_order: 50, active: true, is_default: false, color_hex: '#22c55e' },
    { id: '6', name: 'Rejected / Withdrawn', description: 'Declined or withdrawn', display_order: 60, active: true, is_default: false, color_hex: '#ef4444' },
  ]

  useEffect(() => {
    async function fetchStatuses() {
      setLoading(true)
      const hasSupabaseConfig = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
      )

      if (!hasSupabaseConfig && process.env.NODE_ENV !== 'test') {
        setStatuses(fallbackStatuses)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('statuses')
          .select('*')
          .order('display_order', { ascending: true })

        if (!error && data && data.length > 0) {
          setStatuses(data)
        } else {
          setStatuses(fallbackStatuses)
        }
      } catch {
        setStatuses(fallbackStatuses)
      } finally {
        setLoading(false)
      }
    }

    fetchStatuses()
  }, [])

  async function toggleActive(id: string, currentStatus: boolean) {
    if (!currentStatus && !window.confirm('Are you sure you want to reactivate this status?')) return
    if (currentStatus && !window.confirm('Are you sure you want to deactivate this status?')) return

    setStatuses(prev => prev.map(s => s.id === id ? { ...s, active: !currentStatus } : s))

    const hasSupabaseConfig = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
    )
    if (hasSupabaseConfig) {
      await supabase.from('statuses').update({ active: !currentStatus }).eq('id', id)
    }
  }

  async function addStatus(e: React.FormEvent) {
    e.preventDefault()
    if (!newStatusName.trim()) return

    const maxOrder = statuses.reduce((max, s) => Math.max(max, s.display_order), 0)
    const newStatus: Status = {
      id: String(Date.now()),
      name: newStatusName.trim(),
      description: 'Custom status',
      display_order: maxOrder + 10,
      active: true,
      is_default: false,
      color_hex: '#3b82f6'
    }

    setStatuses(prev => [...prev, newStatus])
    setNewStatusName('')
    setIsAdding(false)

    const hasSupabaseConfig = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'
    )
    if (hasSupabaseConfig) {
      await supabase.from('statuses').insert({
        name: newStatus.name,
        display_order: newStatus.display_order,
        active: true,
        is_default: false
      })
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Application Statuses</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {isAdding ? 'Cancel' : '+ Add Status'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={addStatus} className="mb-6 p-4 border rounded bg-gray-50">
          <div className="flex gap-4">
            <input
              type="text"
              id="status-name-input"
              name="status_name"
              aria-label="Status Name"
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
                  onClick={() => toggleActive(status.id, status.active)}
                  className="text-sm border px-3 py-1 rounded hover:bg-gray-50"
                >
                  {status.active ? 'Deactivate' : 'Reactivate'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
