'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

interface StatusStat {
  name: string
  count: number
  color: string
  percent: number
}

const DEFAULT_STATUS_COLORS: Record<string, string> = {
  'Accepted': '#22c55e',
  'VAAD Review': '#f59e0b',
  'Under Review': '#3b82f6',
  'Interview': '#8b5cf6',
  'Incomplete / New': '#64748b',
  'Rejected / Withdrawn': '#ef4444',
}

const INITIAL_STATUS_STATS: StatusStat[] = [
  { name: 'Accepted', count: 0, color: '#22c55e', percent: 0 },
  { name: 'VAAD Review', count: 0, color: '#f59e0b', percent: 0 },
  { name: 'Under Review', count: 0, color: '#3b82f6', percent: 0 },
  { name: 'Interview', count: 0, color: '#8b5cf6', percent: 0 },
  { name: 'Incomplete / New', count: 0, color: '#64748b', percent: 0 },
  { name: 'Rejected / Withdrawn', count: 0, color: '#ef4444', percent: 0 },
]

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState('2025')
  const [selectedSession, setSelectedSession] = useState('All')
  const [loading, setLoading] = useState(true)

  const [totalCampers, setTotalCampers] = useState(0)
  const [acceptedCount, setAcceptedCount] = useState(0)
  const [activeVaadCount, setActiveVaadCount] = useState(0)
  const [signedContractsCount, setSignedContractsCount] = useState(0)
  const [statusStats, setStatusStats] = useState<StatusStat[]>(INITIAL_STATUS_STATS)

  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch statuses
      const { data: statusesData } = await supabase
        .from('statuses')
        .select('*')
        .order('sort_order', { ascending: true })

      // 2. Fetch kids
      let query = supabase.from('kids').select('id, session, year, voting_open, status_id')
      if (selectedYear !== 'All') {
        const yearNum = parseInt(selectedYear, 10)
        if (!isNaN(yearNum)) {
          query = query.eq('year', yearNum)
        }
      }
      if (selectedSession !== 'All') {
        query = query.ilike('session', `%${selectedSession}%`)
      }

      const { data: kidsData } = await query

      // 3. Fetch signed contracts documents count
      const { count: contractsCount } = await supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .ilike('name', '%signed%')

      const kids = kidsData || []
      const statuses = statusesData || []
      const statusMap = new Map<string, string>()
      statuses.forEach((s) => statusMap.set(s.id, s.name))

      const total = kids.length
      setTotalCampers(total)
      setSignedContractsCount(contractsCount || 0)

      // Count per status
      const countsByName: Record<string, number> = {
        'Accepted': 0,
        'VAAD Review': 0,
        'Under Review': 0,
        'Interview': 0,
        'Incomplete / New': 0,
        'Rejected / Withdrawn': 0,
      }

      let activeVaad = 0
      let accepted = 0

      kids.forEach((k) => {
        const statusName = statusMap.get(k.status_id) || 'Under Review'
        if (statusName.toLowerCase().includes('accept')) {
          accepted++
          countsByName['Accepted'] = (countsByName['Accepted'] || 0) + 1
        } else if (statusName.toLowerCase().includes('vaad')) {
          activeVaad++
          countsByName['VAAD Review'] = (countsByName['VAAD Review'] || 0) + 1
        } else if (statusName.toLowerCase().includes('interview')) {
          countsByName['Interview'] = (countsByName['Interview'] || 0) + 1
        } else if (statusName.toLowerCase().includes('reject') || statusName.toLowerCase().includes('withdraw')) {
          countsByName['Rejected / Withdrawn'] = (countsByName['Rejected / Withdrawn'] || 0) + 1
        } else if (statusName.toLowerCase().includes('new') || statusName.toLowerCase().includes('incomplete')) {
          countsByName['Incomplete / New'] = (countsByName['Incomplete / New'] || 0) + 1
        } else {
          countsByName['Under Review'] = (countsByName['Under Review'] || 0) + 1
        }

        if (k.voting_open && !statusName.toLowerCase().includes('accept')) {
          activeVaad++
        }
      })

      setAcceptedCount(accepted)
      setActiveVaadCount(activeVaad)

      // Build stats array
      const statsList: StatusStat[] = Object.entries(countsByName).map(([name, count]) => ({
        name,
        count,
        color: DEFAULT_STATUS_COLORS[name] || '#64748b',
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }))

      setStatusStats(statsList)
    } catch (e) {
      console.error('Error loading dashboard metrics:', e)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedSession])

  useEffect(() => {
    fetchDashboardMetrics()
  }, [fetchDashboardMetrics])

  const acceptanceRate = totalCampers > 0 ? Math.round((acceptedCount / totalCampers) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admissions Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time status metrics and applicant breakdown</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-lg border shadow-sm">
            <label className="text-xs font-semibold text-slate-500">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-sm border-0 font-medium focus:ring-0 cursor-pointer text-slate-800"
            >
              <option value="2025">Summer 2025 (Active)</option>
              <option value="2024">Summer 2024</option>
              <option value="All">All Years</option>
            </select>

            <span className="text-slate-300">|</span>

            <label className="text-xs font-semibold text-slate-500">Session:</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="text-sm border-0 font-medium focus:ring-0 cursor-pointer text-slate-800"
            >
              <option value="All">All Sessions</option>
              <option value="A">Session A</option>
              <option value="B">Session B</option>
            </select>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Applicants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">{loading ? '...' : totalCampers}</div>
              <p className="text-xs text-green-600 mt-1">Real-time database count</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Acceptance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-green-700">{loading ? '...' : `${acceptanceRate}%`}</div>
              <p className="text-xs text-slate-500 mt-1">{acceptedCount} of {totalCampers} approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Active VAAD Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-amber-600">{loading ? '...' : activeVaadCount}</div>
              <p className="text-xs text-slate-500 mt-1">Requires 2/3 acceptances</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Contracts Signed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-indigo-600">{loading ? '...' : signedContractsCount}</div>
              <p className="text-xs text-slate-500 mt-1">Uploaded contract documents</p>
            </CardContent>
          </Card>
        </div>

        {/* Circular Status Visualization & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Applicant Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-around gap-8 py-4">
                {/* Visual Circular Representation */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#e2e8f0"
                      strokeWidth="3.5"
                    />
                    {/* Segment 1: Accepted (Green) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#22c55e"
                      strokeWidth="3.5"
                      strokeDasharray="40 60"
                      strokeDashoffset="0"
                    />
                    {/* Segment 2: VAAD Review (Amber) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                      strokeDasharray="20 80"
                      strokeDashoffset="-40"
                    />
                    {/* Segment 3: Under Review (Blue) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="3.5"
                      strokeDasharray="15 85"
                      strokeDashoffset="-60"
                    />
                    {/* Segment 4: Other (Purple/Gray/Red) */}
                    <circle
                      cx="18"
                      cy="18"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke="#8b5cf6"
                      strokeWidth="3.5"
                      strokeDasharray="25 75"
                      strokeDashoffset="-75"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-slate-900">{totalCampers}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Campers</span>
                  </div>
                </div>

                {/* Status legend list */}
                <div className="space-y-3 w-full sm:w-1/2">
                  {statusStats.map((status) => (
                    <div key={status.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                        <span className="text-slate-700 font-medium">{status.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-900">{status.count}</span>
                        <span className="text-xs text-slate-400 w-8 text-right">{status.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Notifications */}
          <div className="space-y-6">
            <Card id="notifications">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  <span>Recent Notifications</span>
                  <span className="text-xs font-normal text-green-700">@mentions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                  <span className="font-semibold text-amber-900">@System</span>: Welcome to Oorah Admissions Portal. Real-time metrics synced.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/campers/new">+ Register New Camper</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/session-a/campers">Browse Session A Campers</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/session-b/campers">Browse Session B Campers</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm" asChild>
                  <Link href="/admin/vaad-choices">Manage VAAD Voting Choices</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
