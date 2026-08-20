'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Manage Camp Sessions</h1>
          <p className="text-sm text-slate-500">Configure Session A / Session B cohorts</p>
        </div>
        <Button>+ Add Session</Button>
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
                <Button variant="outline" size="sm">Edit Schedule</Button>
                <Button variant="outline" size="sm">View Campers</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
