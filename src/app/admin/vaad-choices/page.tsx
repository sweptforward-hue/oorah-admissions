'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface VaadChoice {
  id: string
  label: string
  color: string | null
  action: string | null
  active: boolean
  sort_order: number
}

export default function VaadChoicesPage() {
  const [choices, setChoices] = useState<VaadChoice[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newChoiceName, setNewChoiceName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editOrder, setEditOrder] = useState<number>(0)

  useEffect(() => {
    fetchChoices()
  }, [])

  async function fetchChoices() {
    setLoading(true)
    const { data } = await supabase
      .from('vaad_choices')
      .select('*')
      .order('sort_order', { ascending: true })

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setChoices(data.map((c: any) => ({
        id: c.id,
        label: c.label || c.name || '',
        color: c.color || c.color_hex || null,
        action: c.action || 'none',
        active: c.active ?? c.is_active ?? true,
        sort_order: c.sort_order ?? c.display_order ?? 0,
      })))
    }
    setLoading(false)
  }

  async function toggleActive(id: string, currentStatus: boolean) {
    if (!currentStatus && !window.confirm('Are you sure you want to reactivate this choice?')) return;
    if (currentStatus && !window.confirm('Are you sure you want to deactivate this choice? Historical votes will remain, but this choice will no longer be available.')) return;

    const { error } = await supabase
      .from('vaad_choices')
      .update({ active: !currentStatus })
      .eq('id', id)

    if (!error) {
      fetchChoices()
    }
  }

  async function startEditing(choice: VaadChoice) {
    setEditingId(choice.id)
    setEditName(choice.label)
    setEditOrder(choice.sort_order)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return

    const { error } = await supabase
      .from('vaad_choices')
      .update({
        label: editName.trim(),
        sort_order: editOrder
      })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      fetchChoices()
    }
  }

  async function addChoice(e: React.FormEvent) {
    e.preventDefault()
    if (!newChoiceName.trim()) return

    const maxOrder = choices.reduce((max, c) => Math.max(max, c.sort_order), 0)

    const { error } = await supabase
      .from('vaad_choices')
      .insert({
        label: newChoiceName.trim(),
        sort_order: maxOrder + 10,
        active: true,
        action: newChoiceName.trim().toLowerCase().replace(/\s+/g, '_')
      })

    if (!error) {
      setNewChoiceName('')
      setIsAdding(false)
      fetchChoices()
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">VAAD Voting Choices</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {isAdding ? 'Cancel' : '+ Add Choice'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={addChoice} className="mb-6 p-4 border rounded bg-gray-50">
          <div className="flex gap-4">
            <input
              type="text"
              value={newChoiceName}
              onChange={(e) => setNewChoiceName(e.target.value)}
              placeholder="Choice Name (e.g. Needs Interview)"
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
        {choices.map(choice => (
          <div key={choice.id} className={`p-4 border rounded flex justify-between items-center ${!choice.active ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
            <div>
              {editingId === choice.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="p-1 border rounded"
                  />
                  <input
                    type="number"
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                    className="p-1 border rounded w-24"
                  />
                </div>
              ) : (
                <>
                  <h3 className="font-semibold">{choice.label}</h3>
                  <p className="text-sm text-gray-500">
                    Order: {choice.sort_order} {choice.color && `• Color: ${choice.color}`}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              {editingId === choice.id ? (
                <>
                  <button onClick={() => saveEdit(choice.id)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-sm border px-3 py-1 rounded">Cancel</button>
                </>
              ) : (
                <>
                  <span className={`px-2 py-1 text-xs rounded ${choice.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                    {choice.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => startEditing(choice)}
                    className="text-sm border px-3 py-1 rounded hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(choice.id, choice.active)}
                    className="text-sm border px-3 py-1 rounded hover:bg-gray-50"
                  >
                    {choice.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
