'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createBrowserClient } from '@/lib/supabase/client'

interface StatusItem {
  id: string
  name: string
  color: string
}

interface KidItem {
  id: string
  status_id?: string
  session?: string
  year?: number
  voting_open?: boolean
}

interface StatusStat {
  name: string
  count: number
  color: string
  percent: number
}

interface AuditItem {
  id: string
  action: string
  entity_type: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState('2025')
  const [selectedSession, setSelectedSession] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [statuses, setStatuses] = useState<StatusItem[]>([])
  const [kids, setKids] = useState<KidItem[]>([])
  const [recentAudits, setRecentAudits] = useState<AuditItem[]>([])

  useEffect(() => {
    let isMounted = true

    async function fetchDashboardData() {
      try {
        setLoading(true)
        const supabase = createBrowserClient()

        // 1. Fetch Statuses
        const { data: statusData } = await supabase
          .from('statuses')
          .select('id, name, color')
          .order('sort_order', { ascending: true })

        // 2. Fetch Kids
        const { data: kidsData } = await supabase
          .from('kids')
          .select('id, status_id, session, year, voting_open')

        // 3. Fetch Recent Audit Logs
        const { data: auditData } = await supabase
          .from('audit_log')
          .select('id, action, entity_type, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        if (isMounted) {
          if (statusData && statusData.length > 0) {
            setStatuses(
              statusData.map((s) => ({
                id: s.id,
                name: s.name,
                color: s.color || '#64748b',
              }))
            )
          }
          if (kidsData) {
            setKids(kidsData)
          }
          if (auditData) {
            setRecentAudits(auditData)
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  // Filter kids based on selectedYear and selectedSession
  const filteredKids = useMemo(() => {
    return kids.filter((k) => {
      const matchesYear = selectedYear === 'All' || !k.year || String(k.year) === selectedYear
      const matchesSession = selectedSession === 'All' || !k.session || k.session === selectedSession
      return matchesYear && matchesSession
    })
  }, [kids, selectedYear, selectedSession])

  const totalCampers = filteredKids.length

  // Build Status Stats dynamically
  const statusStats: StatusStat[] = useMemo(() => {
    if (statuses.length === 0) {
      return []
    }

    return statuses.map((st) => {
      const count = filteredKids.filter((k) => k.status_id === st.id).length
      const percent = totalCampers > 0 ? Math.round((count / totalCampers) * 100) : 0
      return {
        name: st.name,
        count,
        color: st.color,
        percent,
      }
    })
  }, [statuses, filteredKids, totalCampers])

  // Key metrics calculation
  const acceptedStatus = statuses.find((s) => s.name.toLowerCase().includes('accept'))
  const acceptedCount = acceptedStatus
    ? filteredKids.filter((k) => k.status_id === acceptedStatus.id).length
    : 0
  const acceptanceRate = totalCampers > 0 ? Math.round((acceptedCount / totalCampers) * 100) : 0

  const activeVaadVotes = filteredKids.filter((k) => k.voting_open === true).length

  const contractStatus = statuses.find((s) =>
    s.name.toLowerCase().includes('contract') || s.name.toLowerCase().includes('enrolled')
  )
  const contractsSigned = contractStatus
    ? filteredKids.filter((k) => k.status_id === contractStatus.id).length
    : 0
  const contractRate = totalCampers > 0 ? Math.round((contractsSigned / totalCampers) * 100) : 0

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/campers?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/campers')
    }
  }

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
            <label htmlFor="year-select" className="text-xs font-semibold text-slate-500">Year:</label>
            <select
              id="year-select"
              name="year"
              aria-label="Admissions Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-sm border-0 font-medium focus:ring-0 cursor-pointer text-slate-800"
            >
              <option value="All">All Years</option>
              <option value="2025">Summer 2025</option>
              <option value="2024">Summer 2024</option>
            </select>

            <span className="text-slate-300">|</span>

            <label htmlFor="session-select" className="text-xs font-semibold text-slate-500">Session:</label>
            <select
              id="session-select"
              name="session"
              aria-label="Admissions Session"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="text-sm border-0 font-medium focus:ring-0 cursor-pointer text-slate-800"
            >
              <option value="All">All Sessions</option>
              <option value="Session A">Session A</option>
              <option value="Session B">Session B</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Bar & Global Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-3 rounded-xl border border-slate-200 shadow-sm animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Quick Filters:</span>
            <Button
              variant="outline"
              size="sm"
              className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              onClick={() => router.push('/campers?status=VAAD+Review')}
            >
              VAAD Review
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
              onClick={() => router.push('/campers?status=Under+Review')}
            >
              Under Review
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
              onClick={() => router.push('/campers?status=Accepted')}
            >
              Accepted
            </Button>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <input
              type="text"
              id="camper-search"
              name="camper_search"
              aria-label="Search camper or application ID"
              placeholder="Search camper or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Applicants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">
                {loading ? '...' : totalCampers}
              </div>
              <p className="text-xs text-slate-500 mt-1">Live database total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Acceptance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-green-700">
                {loading ? '...' : `${acceptanceRate}%`}
              </div>
              <p className="text-xs text-slate-500 mt-1">{acceptedCount} of {totalCampers} approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Active VAAD Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-amber-600">
                {loading ? '...' : activeVaadVotes}
              </div>
              <p className="text-xs text-slate-500 mt-1">Open for voting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Contracts Signed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-indigo-600">
                {loading ? '...' : contractsSigned}
              </div>
              <p className="text-xs text-slate-500 mt-1">{contractRate}% signature completion</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Applicant Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading admissions metrics...</div>
              ) : totalCampers === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <span className="text-4xl block mb-3">📋</span>
                  <p className="font-semibold text-slate-700">No applicants registered yet</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Register applicants to view real-time status breakdowns.
                  </p>
                  <Button asChild size="sm">
                    <Link href="/campers/new">+ Register First Camper</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-8 py-4">
                  {/* Status legend list */}
                  <div className="space-y-3 w-full">
                    {statusStats.map((status) => (
                      <div key={status.name} className="flex items-center justify-between text-sm border-b pb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: status.color || '#94a3b8' }}
                          />
                          <span className="text-slate-700 font-medium">{status.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900">{status.count}</span>
                          <span className="text-xs text-slate-400 w-10 text-right">{status.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Notifications */}
          <div className="space-y-6">
            <Card id="notifications">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                  <span>Recent Activity</span>
                  <span className="text-xs font-normal text-slate-400">Audit Trail</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAudits.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No recent audit log activity.</p>
                ) : (
                  recentAudits.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <span className="font-semibold text-slate-800">{item.action}</span>
                      <span className="text-slate-500"> on {item.entity_type}</span>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
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
