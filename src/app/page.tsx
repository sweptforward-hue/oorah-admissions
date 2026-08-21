import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined
  if (params?.error || params?.error_code) {
    redirect('/access-denied')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            Admissions & Operations Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Oorah Admissions Management
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Comprehensive system for processing camper applications, managing VAAD voting, staff operations, contracts, and multi-session enrollments.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link
            href="/dashboard"
            className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-green-300 group"
          >
            <div className="text-3xl mb-3">📊</div>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-green-700">
              Dashboard
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              View circular status graphs, acceptance rates, and overall admissions analytics.
            </p>
          </Link>

          <Link
            href="/session-a/campers"
            className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-green-300 group"
          >
            <div className="text-3xl mb-3">🏕️</div>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-green-700">
              Session A
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Manage campers, bunk assignments, and staff roster for Session A.
            </p>
          </Link>

          <Link
            href="/session-b/campers"
            className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-green-300 group"
          >
            <div className="text-3xl mb-3">🌲</div>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-green-700">
              Session B
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Manage campers, bunk assignments, and staff roster for Session B.
            </p>
          </Link>

          <Link
            href="/admin"
            className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-red-300 group"
          >
            <div className="text-3xl mb-3">⚙️</div>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-red-700">
              Admin Center
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Users, years, sessions, voting choices, custom fields, and audit log.
            </p>
          </Link>
        </div>

        {/* Action Banner */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-800 text-white rounded-2xl p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">Ready to register a new applicant?</h3>
            <p className="text-green-100 text-sm mt-1">
              Start an application workspace with automatic document checklist and VAAD assignment.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/campers/new"
              className="px-6 py-3 bg-white text-green-900 font-bold rounded-lg shadow hover:bg-green-50 transition-colors"
            >
              + Create New Camper
            </Link>
            <Link
              href="/help"
              className="px-6 py-3 bg-green-900/60 text-white font-semibold rounded-lg hover:bg-green-900/80 transition-colors"
            >
              View User Guide
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
