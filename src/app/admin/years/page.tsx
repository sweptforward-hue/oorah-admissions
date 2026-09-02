'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createYear, updateYear } from '@/lib/admin/actions'

interface YearItem {
  id: string
  name: string
  is_active: boolean
  is_default: boolean
}

export default function AdminYearsPage() {
  const [years, setYears] = useState<YearItem[]>([
    { id: '1', name: 'Summer 2025', is_active: true, is_default: true },
    { id: '2', name: 'Summer 2024', is_active: false, is_default: false },
  ])
  const [newYear, setNewYear] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newYear.trim()) return

    const yearName = newYear.trim()
    startTransition(async () => {
      try {
        await createYear(yearName)
        setYears(prev => [...prev, { id: String(Date.now()), name: yearName, is_active: true, is_default: false }])
        setNewYear('')
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to create year')
      }
    })
  }

  const handleEditYear = async (id: string, currentName: string) => {
    const updatedName = prompt('Enter updated Year name:', currentName)
    if (!updatedName || updatedName.trim() === currentName) return

    const yearNum = parseInt(updatedName.replace(/\D/g, ''), 10)
    startTransition(async () => {
      try {
        if (!isNaN(yearNum)) {
          await updateYear(id, { year: yearNum })
        }
        setYears(years.map(y => y.id === id ? { ...y, name: updatedName.trim() } : y))
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update year')
      }
    })
  }

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    const newActive = !currentActive
    startTransition(async () => {
      try {
        await updateYear(id, { is_active: newActive })
        setYears(years.map(y => y.id === id ? { ...y, is_active: newActive } : y))
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update status')
      }
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Manage Operational Years</h1>

      <form onSubmit={handleAddYear} className="mb-8 flex gap-3 p-4 bg-white border rounded-lg shadow-sm">
        <input
          type="text"
          value={newYear}
          onChange={(e) => setNewYear(e.target.value)}
          placeholder="New Year Name (e.g. Summer 2026)"
          className="flex-1 p-2 border rounded-md text-sm"
        />
        <Button type="submit" disabled={isPending}>+ Create Year</Button>
      </form>

      <div className="space-y-4">
        {years.map((y) => (
          <Card key={y.id} className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                {y.name}
                {y.is_default && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Default</span>}
              </h3>
              <p className="text-xs text-slate-500">Status: {y.is_active ? 'Active' : 'Archived'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleEditYear(y.id, y.name)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleToggleStatus(y.id, y.is_active)}>
                {y.is_active ? 'Archive' : 'Activate'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
