'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getYears, createYear, updateYear, YearItem } from '@/lib/admin/actions'

export default function AdminYearsPage() {
  const [years, setYears] = useState<YearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newYear, setNewYear] = useState('')
  const [isPending, startTransition] = useTransition()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getYears()
      setYears(data)
    } catch (e) {
      console.error('Failed to load years:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newYear.trim()) return

    const yearName = newYear.trim()
    startTransition(async () => {
      try {
        await createYear(yearName)
        await loadData()
        setNewYear('')
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to create year')
      }
    })
  }

  const handleEditYear = async (id: string, currentYear: number) => {
    const updatedName = prompt('Enter updated Year number:', String(currentYear))
    if (!updatedName) return

    const yearNum = parseInt(updatedName.replace(/\D/g, ''), 10)
    if (isNaN(yearNum) || yearNum === currentYear) return

    startTransition(async () => {
      try {
        await updateYear(id, { year: yearNum })
        await loadData()
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
        await loadData()
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update status')
      }
    })
  }

  if (loading) return <div className="p-8 text-slate-600">Loading operational years...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Manage Operational Years</h1>

      <form onSubmit={handleAddYear} className="mb-8 flex gap-3 p-4 bg-white border rounded-lg shadow-sm">
        <input
          type="text"
          value={newYear}
          onChange={(e) => setNewYear(e.target.value)}
          placeholder="New Year Name (e.g. Summer 2026 or 2026)"
          className="flex-1 p-2 border rounded-md text-sm"
        />
        <Button type="submit" disabled={isPending}>+ Create Year</Button>
      </form>

      {years.length === 0 ? (
        <div className="p-8 text-center text-slate-500 border border-dashed rounded bg-slate-50 text-sm">
          No operational years found in schema.
        </div>
      ) : (
        <div className="space-y-4">
          {years.map((y) => (
            <Card key={y.id} className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  Summer {y.year}
                  {y.is_active && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-normal">Active</span>}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Status: {y.is_active ? 'Active' : 'Archived'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleEditYear(y.id, y.year)}>
                  Edit
                </Button>
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleToggleStatus(y.id, y.is_active)}>
                  {y.is_active ? 'Archive' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
