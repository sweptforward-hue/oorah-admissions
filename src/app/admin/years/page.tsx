'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

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

  const handleAddYear = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newYear.trim()) return
    setYears([...years, { id: String(Date.now()), name: newYear.trim(), is_active: true, is_default: false }])
    setNewYear('')
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
        <Button type="submit">+ Create Year</Button>
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
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="outline" size="sm">{y.is_active ? 'Archive' : 'Activate'}</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
