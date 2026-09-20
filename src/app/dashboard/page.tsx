'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface StatusStat {
  name: string
  count: number
  color: string
  percent: number
}

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState('2025')
  const [selectedSession, setSelectedSession] = useState('All')

  // Status breakdown data
  const statusStats: StatusStat[] = [
    { name: 'Accepted', count: 48, color: '#22c55e', percent: 40 },
    { name: 'VAAD Review', count: 24, color: '#f59e0b', percent: 20 },
    { name: 'Under Review', count: 18, color: '#3b82f6', percent: 15 },
    { name: 'Interview', count: 12, color: '#8b5cf6', percent: 10 },
    { name: 'Incomplete / New', count: 12, color: '#64748b', percent: 10 },
    { name: 'Rejected / Withdrawn', count: 6, color: '#ef4444', percent: 5 },
  ]

  const totalCampers = statusStats.reduce((acc, curr) => acc + curr.count, 0)
  const acceptanceRate = Math.round((statusStats[0].count / totalCampers) * 100)

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

        {/* Quick Filter Bar & Global Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-3 rounded-xl border border-slate-200 shadow-sm animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Quick Filters:</span>
            <button className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-200 hover:bg-green-100 transition-colors">Needs VAAD</button>
            <button className="px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">Missing Docs</button>
            <button className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">Interview Prep</button>
          </div>
          <div className="relative w-full sm:w-64">
            <input type="text" placeholder="Search camper or ID (⌘K)" className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-slate-50" />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Applicants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900">{totalCampers}</div>
              <p className="text-xs text-green-600 mt-1">↑ +14% compared to last season</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Acceptance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-green-700">{acceptanceRate}%</div>
              <p className="text-xs text-slate-500 mt-1">48 of 120 approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Active VAAD Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-amber-600">24</div>
              <p className="text-xs text-slate-500 mt-1">Requires 2/3 acceptances</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Contracts Signed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-indigo-600">38</div>
              <p className="text-xs text-slate-500 mt-1">79% signature completion</p>
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
                  <span className="font-semibold text-amber-900">@Azriel Cohenca</span>: David Katz requires your second VAAD signature.
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                  <span className="font-semibold text-blue-900">@Admissions</span>: New transcript uploaded for Sarah Cohen (App #1043).
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
