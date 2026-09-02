'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createSession, updateSessionSchedule } from '@/lib/admin/actions'

interface SessionItem {
  id: string
  name: string
  yearName: string
  startDate: string
  endDate: string
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([
    { id: '1', name: 'Session A', yearName: 'Summer 2025', startDate: '2025-07-01', endDate: '2025-07-28' },
    { id: '2', name: 'Session B', yearName: 'Summer 2025', startDate: '2025-07-30', endDate: '2025-08-26' },
  ])

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('2026-07-01')
  const [endDate, setEndDate] = useState('2026-07-28')
  const [isPending, startTransition] = useTransition()

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    startTransition(async () => {
      try {
        await createSession({
          name: name.trim(),
          start_date: startDate,
          end_date: endDate
        })
        setSessions([
          ...sessions,
          { id: String(Date.now()), name: name.trim(), yearName: 'Summer 2026', startDate, endDate }
        ])
        setIsAddOpen(false)
        setName('')
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to create session')
      }
    })
  }

  const handleEditSchedule = async (s: SessionItem) => {
    const newStart = prompt('Enter start date (YYYY-MM-DD):', s.startDate)
    if (!newStart) return
    const newEnd = prompt('Enter end date (YYYY-MM-DD):', s.endDate)
    if (!newEnd) return

    startTransition(async () => {
      try {
        await updateSessionSchedule(s.id, newStart, newEnd)
        setSessions(sessions.map(item => item.id === s.id ? { ...item, startDate: newStart, endDate: newEnd } : item))
      } catch (err: unknown) {
        alert((err as Error).message || 'Failed to update session schedule')
      }
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Camp Sessions</h1>
          <p className="text-sm text-slate-500">Configure Session A / Session B cohorts</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>+ Add Session</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((s) => (
          <Card key={s.id} className="p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-bold">{s.name}</CardTitle>
              <span className="text-xs text-slate-500">{s.yearName}</span>
            </CardHeader>
            <CardContent className="p-0 text-sm space-y-2">
              <div><strong>Dates:</strong> {s.startDate} to {s.endDate}</div>
              <div className="pt-4 flex gap-2">
                <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleEditSchedule(s)}>
                  Edit Schedule
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/campers?session=${encodeURIComponent(s.name)}`}>View Campers</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Add Camp Session</h2>
            <form onSubmit={handleAddSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Session C"
                  className="w-full p-2 border rounded-md text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>Save Session</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
