import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <header className="bg-slate-900 text-white border-b sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12 overflow-x-auto items-center">
            <div className="flex items-center">
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded tracking-wide uppercase mr-4">
                Admin Center
              </span>
              <nav className="flex space-x-3 items-center text-xs">
                <Link href="/admin" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Overview</Link>
                <Link href="/admin/campers" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Campers</Link>
                <Link href="/admin/staff" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Staff</Link>
                <Link href="/admin/users" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Users</Link>
                <Link href="/admin/years" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Years</Link>
                <Link href="/admin/sessions" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Sessions</Link>
                <Link href="/admin/statuses" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Statuses</Link>
                <Link href="/admin/vaad-choices" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Voting</Link>
                <Link href="/admin/custom-fields" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Custom Fields</Link>
                <Link href="/admin/exports" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Exports</Link>
                <Link href="/admin/storage" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Storage</Link>
                <Link href="/admin/audit-log" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Audit Log</Link>
                <Link href="/admin/help" className="font-medium text-slate-300 hover:text-white whitespace-nowrap">Help</Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
